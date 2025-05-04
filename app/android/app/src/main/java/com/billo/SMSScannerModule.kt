package com.billo

import android.content.Context
import android.content.SharedPreferences
import android.os.Build
import android.util.Log
import androidx.work.Constraints
import androidx.work.OneTimeWorkRequestBuilder
import androidx.work.WorkManager
import com.facebook.react.bridge.*
import com.facebook.react.modules.core.DeviceEventManagerModule

/**
 * React Native module for managing the SMS scanner background service
 */
class SMSScannerModule(reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {
    private val TAG = "SMSScannerModule"
    
    companion object {
        private const val PREFS_NAME = "SMSScannerPrefs"
        private const val KEY_IS_ENABLED = "isEnabled"
        private const val KEY_SCAN_FREQUENCY = "scanFrequency"
        private const val KEY_LAST_SCAN_TIMESTAMP = "lastScanTimestamp"
        
        // Scan frequency options
        private const val FREQUENCY_LOW = "low"
        private const val FREQUENCY_MEDIUM = "medium"
        private const val FREQUENCY_HIGH = "high"
    }
    
    override fun getName(): String {
        return "SMSScannerModule"
    }
    
    /**
     * Get shared preferences
     */
    private fun getPreferences(): SharedPreferences {
        return reactApplicationContext.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
    }
    
    /**
     * React method to enable SMS background scanning
     */
    @ReactMethod
    fun enableScanning(frequency: String, promise: Promise) {
        try {
            // Save the enabled state
            getPreferences().edit()
                .putBoolean(KEY_IS_ENABLED, true)
                .putString(KEY_SCAN_FREQUENCY, frequency)
                .apply()
            
            // Schedule the work
            SMSScanWorker.schedulePeriodicWork(reactApplicationContext, frequency)
            
            Log.d(TAG, "SMS scanning enabled with frequency: $frequency")
            promise.resolve(true)
        } catch (e: Exception) {
            Log.e(TAG, "Error enabling SMS scanning", e)
            promise.reject("ERROR", "Failed to enable SMS scanning: ${e.message}")
        }
    }
    
    /**
     * React method to disable SMS background scanning
     */
    @ReactMethod
    fun disableScanning(promise: Promise) {
        try {
            // Save the disabled state
            getPreferences().edit()
                .putBoolean(KEY_IS_ENABLED, false)
                .apply()
            
            // Cancel the work
            SMSScanWorker.cancelWork(reactApplicationContext)
            
            Log.d(TAG, "SMS scanning disabled")
            promise.resolve(true)
        } catch (e: Exception) {
            Log.e(TAG, "Error disabling SMS scanning", e)
            promise.reject("ERROR", "Failed to disable SMS scanning: ${e.message}")
        }
    }
    
    /**
     * React method to check if SMS scanning is enabled
     */
    @ReactMethod
    fun isEnabled(promise: Promise) {
        try {
            val isEnabled = getPreferences().getBoolean(KEY_IS_ENABLED, false)
            promise.resolve(isEnabled)
        } catch (e: Exception) {
            Log.e(TAG, "Error checking if SMS scanning is enabled", e)
            promise.reject("ERROR", "Failed to check if SMS scanning is enabled: ${e.message}")
        }
    }
    
    /**
     * React method to get current scan frequency
     */
    @ReactMethod
    fun getScanFrequency(promise: Promise) {
        try {
            val frequency = getPreferences().getString(KEY_SCAN_FREQUENCY, FREQUENCY_MEDIUM)
            promise.resolve(frequency)
        } catch (e: Exception) {
            Log.e(TAG, "Error getting scan frequency", e)
            promise.reject("ERROR", "Failed to get scan frequency: ${e.message}")
        }
    }
    
    /**
     * React method to set scan frequency
     */
    @ReactMethod
    fun setScanFrequency(frequency: String, promise: Promise) {
        try {
            // Check if scanning is enabled
            val isEnabled = getPreferences().getBoolean(KEY_IS_ENABLED, false)
            
            // Save the new frequency
            getPreferences().edit()
                .putString(KEY_SCAN_FREQUENCY, frequency)
                .apply()
            
            // Reschedule the work if enabled
            if (isEnabled) {
                SMSScanWorker.schedulePeriodicWork(reactApplicationContext, frequency)
            }
            
            Log.d(TAG, "Scan frequency set to: $frequency")
            promise.resolve(true)
        } catch (e: Exception) {
            Log.e(TAG, "Error setting scan frequency", e)
            promise.reject("ERROR", "Failed to set scan frequency: ${e.message}")
        }
    }
    
    /**
     * React method to get the timestamp of the last scan
     */
    @ReactMethod
    fun getLastScanTimestamp(promise: Promise) {
        try {
            val lastScanTimestamp = getPreferences().getLong(KEY_LAST_SCAN_TIMESTAMP, 0L)
            promise.resolve(lastScanTimestamp)
        } catch (e: Exception) {
            Log.e(TAG, "Error getting last scan timestamp", e)
            promise.reject("ERROR", "Failed to get last scan timestamp: ${e.message}")
        }
    }
    
    /**
     * React method to run a manual scan now
     */
    @ReactMethod
    fun runManualScan(promise: Promise) {
        try {
            // Create constraints for the one-time scan
            val constraints = Constraints.Builder()
                .setRequiresBatteryNotLow(true)
                .build()
            
            // Create a one-time work request
            val workRequest = OneTimeWorkRequestBuilder<SMSScanWorker>()
                .setConstraints(constraints)
                .addTag("sms_scanner_manual")
                .build()
            
            // Enqueue the work request
            WorkManager.getInstance(reactApplicationContext)
                .enqueue(workRequest)
            
            Log.d(TAG, "Manual SMS scan triggered")
            promise.resolve(true)
        } catch (e: Exception) {
            Log.e(TAG, "Error running manual scan", e)
            promise.reject("ERROR", "Failed to run manual scan: ${e.message}")
        }
    }
    
    /**
     * React method to get scan status (including work state)
     */
    @ReactMethod
    fun getScanStatus(promise: Promise) {
        try {
            val isEnabled = getPreferences().getBoolean(KEY_IS_ENABLED, false)
            val frequency = getPreferences().getString(KEY_SCAN_FREQUENCY, FREQUENCY_MEDIUM)
            val lastScanTimestamp = getPreferences().getLong(KEY_LAST_SCAN_TIMESTAMP, 0L)
            
            val statusMap = Arguments.createMap()
            statusMap.putBoolean("isEnabled", isEnabled)
            statusMap.putString("frequency", frequency)
            statusMap.putDouble("lastScanTimestamp", lastScanTimestamp.toDouble())
            
            promise.resolve(statusMap)
        } catch (e: Exception) {
            Log.e(TAG, "Error getting scan status", e)
            promise.reject("ERROR", "Failed to get scan status: ${e.message}")
        }
    }
} 