package com.billo

import android.content.ContentResolver
import android.database.Cursor
import android.net.Uri
import android.provider.Telephony
import android.util.Log
import androidx.annotation.NonNull
import com.facebook.react.bridge.*
import com.facebook.react.modules.core.DeviceEventManagerModule
import org.json.JSONArray
import org.json.JSONException
import org.json.JSONObject
import java.util.regex.Pattern
import java.util.regex.PatternSyntaxException

/**
 * Native module for accessing SMS messages on Android
 */
class SmsModule(private val reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {
    private val TAG = "SmsModule"

    @NonNull
    override fun getName(): String {
        return "SmsModule"
    }

    /**
     * Send event to JavaScript
     */
    private fun sendEvent(eventName: String, params: Any) {
        reactContext
            .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
            .emit(eventName, params)
    }

    /**
     * React method to list SMS messages with filters
     */
    @ReactMethod
    fun list(filter: String, errorCallback: Callback, successCallback: Callback) {
        try {
            val filterObject = JSONObject(filter)
            val uri = filterObject.optString("box", "inbox")
            
            // Get content provider URI based on SMS box type
            val contentUri: Uri = when (uri.toLowerCase()) {
                "inbox" -> Telephony.Sms.Inbox.CONTENT_URI
                "sent" -> Telephony.Sms.Sent.CONTENT_URI
                "draft" -> Telephony.Sms.Draft.CONTENT_URI
                "outbox" -> Telephony.Sms.Outbox.CONTENT_URI
                "failed" -> Uri.parse("content://sms/failed")
                "queued" -> Uri.parse("content://sms/queued")
                "", "all" -> Telephony.Sms.CONTENT_URI
                else -> {
                    errorCallback.invoke("Invalid SMS box type: $uri")
                    return
                }
            }

            // Build query conditions
            val selection = StringBuilder()
            val selectionArgs = JSONArray()

            // Handle minDate filter
            if (filterObject.has("minDate")) {
                val minDate = filterObject.getLong("minDate")
                addSelection(selection, "${Telephony.Sms.DATE} >= ?")
                selectionArgs.put(minDate.toString())
            }

            // Handle maxDate filter
            if (filterObject.has("maxDate")) {
                val maxDate = filterObject.getLong("maxDate")
                addSelection(selection, "${Telephony.Sms.DATE} <= ?")
                selectionArgs.put(maxDate.toString())
            }

            // Handle read status filter
            if (filterObject.has("read")) {
                val read = filterObject.getInt("read")
                addSelection(selection, "${Telephony.Sms.READ} = ?")
                selectionArgs.put(read.toString())
            }

            // Handle ID filter
            if (filterObject.has("_id")) {
                val id = filterObject.getLong("_id")
                addSelection(selection, "${Telephony.Sms._ID} = ?")
                selectionArgs.put(id.toString())
            }

            // Handle thread_id filter
            if (filterObject.has("thread_id")) {
                val threadId = filterObject.getLong("thread_id")
                addSelection(selection, "${Telephony.Sms.THREAD_ID} = ?")
                selectionArgs.put(threadId.toString())
            }

            // Handle address filter
            if (filterObject.has("address")) {
                val address = filterObject.getString("address")
                addSelection(selection, "${Telephony.Sms.ADDRESS} = ?")
                selectionArgs.put(address)
            }

            // Handle body filter
            if (filterObject.has("body")) {
                val body = filterObject.getString("body")
                addSelection(selection, "${Telephony.Sms.BODY} LIKE ?")
                selectionArgs.put("%$body%")
            }

            // Handle pagination
            val indexFrom = filterObject.optInt("indexFrom", 0)
            val maxCount = filterObject.optInt("maxCount", 10)

            // Execute the query
            val contentResolver: ContentResolver = reactContext.contentResolver
            val sortOrder = "${Telephony.Sms.DATE} DESC LIMIT $indexFrom, $maxCount"
            val cursor: Cursor? = contentResolver.query(
                contentUri,
                null,
                if (selection.isNotEmpty()) selection.toString() else null,
                if (selectionArgs.length() > 0) toStringArray(selectionArgs) else null,
                sortOrder
            )

            if (cursor == null) {
                errorCallback.invoke("Failed to retrieve SMS messages")
                return
            }

            // Process query results
            try {
                val smsList = Arguments.createArray()
                var count = 0

                if (cursor.moveToFirst()) {
                    // Get column indices for all fields
                    val idIndex = cursor.getColumnIndexOrThrow(Telephony.Sms._ID)
                    val threadIdIndex = cursor.getColumnIndexOrThrow(Telephony.Sms.THREAD_ID)
                    val addressIndex = cursor.getColumnIndexOrThrow(Telephony.Sms.ADDRESS)
                    val personIndex = cursor.getColumnIndexOrThrow(Telephony.Sms.PERSON)
                    val dateIndex = cursor.getColumnIndexOrThrow(Telephony.Sms.DATE)
                    val dateSentIndex = cursor.getColumnIndexOrThrow(Telephony.Sms.DATE_SENT)
                    val protocolIndex = cursor.getColumnIndexOrThrow(Telephony.Sms.PROTOCOL)
                    val readIndex = cursor.getColumnIndexOrThrow(Telephony.Sms.READ)
                    val statusIndex = cursor.getColumnIndexOrThrow(Telephony.Sms.STATUS)
                    val typeIndex = cursor.getColumnIndexOrThrow(Telephony.Sms.TYPE)
                    val bodyIndex = cursor.getColumnIndexOrThrow(Telephony.Sms.BODY)
                    val serviceCenterIndex = cursor.getColumnIndexOrThrow(Telephony.Sms.SERVICE_CENTER)
                    
                    // Regular expression pattern
                    var bodyRegexPattern: Pattern? = null
                    if (filterObject.has("bodyRegex")) {
                        try {
                            bodyRegexPattern = Pattern.compile(filterObject.getString("bodyRegex"))
                        } catch (e: PatternSyntaxException) {
                            errorCallback.invoke("Invalid regex pattern: ${e.message}")
                            return
                        }
                    }

                    do {
                        // Extract current SMS message data
                        val body = cursor.getString(bodyIndex)
                        
                        // Apply regex filter if needed
                        if (bodyRegexPattern != null && !bodyRegexPattern.matcher(body).matches()) {
                            continue
                        }

                        // Create map for SMS data
                        val map = Arguments.createMap()
                        map.putInt("_id", cursor.getInt(idIndex))
                        map.putInt("thread_id", cursor.getInt(threadIdIndex))
                        map.putString("address", cursor.getString(addressIndex))
                        map.putInt("person", cursor.getInt(personIndex))
                        map.putDouble("date", cursor.getLong(dateIndex).toDouble())
                        map.putDouble("date_sent", cursor.getLong(dateSentIndex).toDouble())
                        map.putInt("protocol", cursor.getInt(protocolIndex))
                        map.putInt("read", cursor.getInt(readIndex))
                        map.putInt("status", cursor.getInt(statusIndex))
                        map.putInt("type", cursor.getInt(typeIndex))
                        map.putString("body", body)
                        map.putString("service_center", cursor.getString(serviceCenterIndex))
                        
                        smsList.pushMap(map)
                        count++
                    } while (cursor.moveToNext())
                }

                successCallback.invoke(count, smsList.toString())
            } finally {
                cursor.close()
            }
        } catch (e: JSONException) {
            errorCallback.invoke("Failed to parse filter: ${e.message}")
        } catch (e: Exception) {
            errorCallback.invoke("Failed to retrieve SMS messages: ${e.message}")
        }
    }

    /**
     * Helper method to add a condition to the SQL selection
     */
    private fun addSelection(selection: StringBuilder, condition: String) {
        if (selection.isNotEmpty()) {
            selection.append(" AND ")
        }
        selection.append(condition)
    }

    /**
     * Convert JSON array to string array
     */
    @Throws(JSONException::class)
    private fun toStringArray(jsonArray: JSONArray): Array<String> {
        val stringArray = Array(jsonArray.length()) { "" }
        for (i in 0 until jsonArray.length()) {
            stringArray[i] = jsonArray.getString(i)
        }
        return stringArray
    }
} 