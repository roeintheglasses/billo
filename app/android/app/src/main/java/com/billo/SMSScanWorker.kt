package com.billo

import android.content.Context
import android.content.SharedPreferences
import android.database.Cursor
import android.net.ConnectivityManager
import android.net.NetworkCapabilities
import android.os.BatteryManager
import android.provider.Telephony
import android.util.Log
import androidx.work.*
import com.facebook.react.bridge.Arguments
import com.facebook.react.modules.core.DeviceEventManagerModule
import com.facebook.react.bridge.ReactApplicationContext
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import org.json.JSONObject
import java.util.concurrent.TimeUnit

/**
 * WorkManager worker for scanning SMS messages in the background
 * This handles periodic scanning while respecting battery and network constraints
 */
class SMSScanWorker(
    private val context: Context,
    params: WorkerParameters
) : CoroutineWorker(context, params) {
    private val TAG = "SMSScanWorker"
    
    // Shared preferences key for storing last scan timestamp
    companion object {
        private const val PREFS_NAME = "SMSScannerPrefs"
        private const val KEY_LAST_SCAN_TIMESTAMP = "lastScanTimestamp"
        private const val KEY_LAST_SMS_ID = "lastSmsId"
        private const val KEY_SCAN_FREQUENCY = "scanFrequency"
        
        // Scan frequency options
        private const val FREQUENCY_LOW = "low"
        private const val FREQUENCY_MEDIUM = "medium"
        private const val FREQUENCY_HIGH = "high"
        
        // Default scan interval in minutes
        private const val DEFAULT_SCAN_INTERVAL = 30L
        
        /**
         * Schedule the periodic work request with the specified frequency
         */
        fun schedulePeriodicWork(context: Context, frequency: String = FREQUENCY_MEDIUM) {
            val workManager = WorkManager.getInstance(context)
            
            // Save frequency preference
            getPreferences(context).edit().putString(KEY_SCAN_FREQUENCY, frequency).apply()
            
            // Calculate interval based on frequency setting
            val intervalMinutes = when (frequency) {
                FREQUENCY_LOW -> 60L   // Once per hour
                FREQUENCY_MEDIUM -> 30L // Twice per hour
                FREQUENCY_HIGH -> 15L   // Four times per hour (minimum allowed by WorkManager)
                else -> DEFAULT_SCAN_INTERVAL
            }
            
            // Create constraints
            val constraints = Constraints.Builder()
                .setRequiresBatteryNotLow(true) // Don't run when battery is low
                .build()
            
            // Create the periodic request
            val workRequest = PeriodicWorkRequestBuilder<SMSScanWorker>(
                intervalMinutes, TimeUnit.MINUTES,
                // Flex period gives WorkManager flexibility to schedule the work
                // at the optimal time within the interval
                intervalMinutes / 4, TimeUnit.MINUTES
            )
                .setConstraints(constraints)
                .addTag("sms_scanner")
                .build()
            
            // Enqueue unique periodic work to ensure only one instance runs
            workManager.enqueueUniquePeriodicWork(
                "sms_scan_work",
                ExistingPeriodicWorkPolicy.UPDATE, // Replace existing work if any
                workRequest
            )
            
            Log.d("SMSScanWorker", "Scheduled periodic SMS scanning with frequency: $frequency")
        }
        
        /**
         * Cancel scheduled work
         */
        fun cancelWork(context: Context) {
            WorkManager.getInstance(context).cancelUniqueWork("sms_scan_work")
            Log.d("SMSScanWorker", "Cancelled SMS scanning work")
        }
        
        /**
         * Get shared preferences for storing scanner state
         */
        private fun getPreferences(context: Context): SharedPreferences {
            return context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
        }
    }
    
    /**
     * Execute the background work
     */
    override suspend fun doWork(): Result = withContext(Dispatchers.IO) {
        Log.d(TAG, "Starting SMS scan work")
        
        try {
            // Get battery level to determine processing intensity
            val batteryManager = applicationContext.getSystemService(Context.BATTERY_SERVICE) as BatteryManager
            val batteryLevel = batteryManager.getIntProperty(BatteryManager.BATTERY_PROPERTY_CAPACITY)
            
            // Check if we're on WiFi for heavy processing
            val isOnWifi = isConnectedToWifi(applicationContext)
            
            // Get the last scan timestamp
            val prefs = getPreferences(applicationContext)
            val lastScanTimestamp = prefs.getLong(KEY_LAST_SCAN_TIMESTAMP, 0L)
            var lastSmsId = prefs.getLong(KEY_LAST_SMS_ID, 0L)
            
            Log.d(TAG, "Last scan timestamp: $lastScanTimestamp, battery level: $batteryLevel, on WiFi: $isOnWifi")
            
            // Only process new messages since last scan
            val newMessages = scanForNewMessages(lastScanTimestamp)
            
            // If there are no new messages, return success
            if (newMessages.isEmpty()) {
                Log.d(TAG, "No new messages found since last scan")
                return@withContext Result.success()
            }
            
            Log.d(TAG, "Found ${newMessages.size} new messages")
            
            // Process messages based on battery level
            val detectedSubscriptions = mutableListOf<JSONObject>()
            
            // Always do a quick scan regardless of battery level
            for (message in newMessages) {
                val isSubscription = quickScanForSubscription(message)
                
                if (isSubscription) {
                    detectedSubscriptions.add(message)
                    Log.d(TAG, "Detected potential subscription in message ID: ${message.getLong("_id")}")
                }
                
                // Update last message ID if this message is newer
                val messageId = message.getLong("_id")
                if (messageId > lastSmsId) {
                    lastSmsId = messageId
                }
            }
            
            // Save the latest scan timestamp and message ID
            val currentTimestamp = System.currentTimeMillis()
            prefs.edit()
                .putLong(KEY_LAST_SCAN_TIMESTAMP, currentTimestamp)
                .putLong(KEY_LAST_SMS_ID, lastSmsId)
                .apply()
            
            // If we have subscription messages and appropriate conditions, do deeper processing
            if (detectedSubscriptions.isNotEmpty()) {
                // Battery threshold for deeper processing: 30% on WiFi, 50% without
                val batteryThreshold = if (isOnWifi) 30 else 50
                
                if (batteryLevel >= batteryThreshold) {
                    // Send the detected subscriptions to React Native
                    detectedSubscriptions.forEach { message ->
                        // Create JSON representation of the message
                        sendSubscriptionDetectionEvent(message)
                    }
                } else {
                    // Battery too low for deep processing, save for later
                    Log.d(TAG, "Battery level too low for deep processing, will try again later")
                    
                    // We'll retry the next time the worker runs
                    // This could be improved with a dedicated queue for pending messages
                }
            }
            
            Log.d(TAG, "SMS scan work completed successfully")
            Result.success()
        } catch (e: Exception) {
            Log.e(TAG, "Error in SMS scan worker", e)
            // Retry with backoff
            Result.retry()
        }
    }
    
    /**
     * Check if device is connected to WiFi
     */
    private fun isConnectedToWifi(context: Context): Boolean {
        val connectivityManager = context.getSystemService(Context.CONNECTIVITY_SERVICE) as ConnectivityManager
        val network = connectivityManager.activeNetwork ?: return false
        val capabilities = connectivityManager.getNetworkCapabilities(network) ?: return false
        return capabilities.hasTransport(NetworkCapabilities.TRANSPORT_WIFI)
    }
    
    /**
     * Quick scan for subscription patterns without deep analysis
     */
    private fun quickScanForSubscription(message: JSONObject): Boolean {
        // This is a simplified version that just checks for common keywords
        // In a real implementation, you would use more sophisticated pattern matching
        val body = message.optString("body", "").toLowerCase()
        val sender = message.optString("address", "").toLowerCase()
        
        // Quick check for common subscription keywords
        val subscriptionKeywords = listOf(
            "subscription", "subscribed", "recurring", "payment", "monthly",
            "yearly", "weekly", "billed", "premium", "plan", "trial"
        )
        
        return subscriptionKeywords.any { keyword -> body.contains(keyword) }
    }
    
    /**
     * Scan for new SMS messages since the last scan
     */
    private fun scanForNewMessages(lastScanTimestamp: Long): List<JSONObject> {
        val messages = mutableListOf<JSONObject>()
        
        val contentResolver = applicationContext.contentResolver
        
        // Query for messages newer than the last scan
        val selection = "${Telephony.Sms.DATE} > ?"
        val selectionArgs = arrayOf(lastScanTimestamp.toString())
        val sortOrder = "${Telephony.Sms.DATE} ASC" // Oldest to newest
        
        var cursor: Cursor? = null
        
        try {
            cursor = contentResolver.query(
                Telephony.Sms.Inbox.CONTENT_URI,
                null,
                selection,
                selectionArgs,
                sortOrder
            )
            
            if (cursor != null && cursor.moveToFirst()) {
                // Get column indices
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
                
                do {
                    // Convert to JSONObject to match the format used in SmsModule
                    val message = JSONObject()
                    message.put("_id", cursor.getLong(idIndex))
                    message.put("thread_id", cursor.getLong(threadIdIndex))
                    message.put("address", cursor.getString(addressIndex))
                    message.put("person", cursor.getInt(personIndex))
                    message.put("date", cursor.getLong(dateIndex))
                    message.put("date_sent", cursor.getLong(dateSentIndex))
                    message.put("protocol", cursor.getInt(protocolIndex))
                    message.put("read", cursor.getInt(readIndex))
                    message.put("status", cursor.getInt(statusIndex))
                    message.put("type", cursor.getInt(typeIndex))
                    message.put("body", cursor.getString(bodyIndex))
                    message.put("service_center", cursor.getString(serviceCenterIndex))
                    
                    messages.add(message)
                } while (cursor.moveToNext())
            }
        } catch (e: Exception) {
            Log.e(TAG, "Error scanning for new messages", e)
        } finally {
            cursor?.close()
        }
        
        return messages
    }
    
    /**
     * Send subscription detection event to React Native
     */
    private fun sendSubscriptionDetectionEvent(message: JSONObject) {
        try {
            // Convert JSONObject to WritableMap for React Native
            val writableMap = Arguments.createMap()
            val keys = message.keys()
            while (keys.hasNext()) {
                val key = keys.next()
                val value = message.get(key)
                when (value) {
                    is Int -> writableMap.putInt(key, value)
                    is Long -> writableMap.putDouble(key, value.toDouble())
                    is Double -> writableMap.putDouble(key, value)
                    is Boolean -> writableMap.putBoolean(key, value)
                    else -> writableMap.putString(key, value.toString())
                }
            }
            
            // Add confidence and pattern type
            writableMap.putInt("confidence", 70) // Default medium confidence for simple detection
            writableMap.putInt("patternType", 1) // Default pattern type
            
            // Send event to JavaScript
            val reactContext = applicationContext as? ReactApplicationContext
            reactContext?.getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
                ?.emit("subscriptionDetected", writableMap)
            
            Log.d(TAG, "Sent subscription detection event to React Native")
        } catch (e: Exception) {
            Log.e(TAG, "Error sending subscription detection event", e)
        }
    }
} 