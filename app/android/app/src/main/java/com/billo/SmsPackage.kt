package com.billo

import androidx.annotation.NonNull
import com.facebook.react.ReactPackage
import com.facebook.react.bridge.NativeModule
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.uimanager.ViewManager

/**
 * Package for registering the SmsModule native module
 */
class SmsPackage : ReactPackage {
    
    @NonNull
    override fun createNativeModules(@NonNull reactContext: ReactApplicationContext): List<NativeModule> {
        val modules = ArrayList<NativeModule>()
        modules.add(SmsModule(reactContext))
        return modules
    }

    @NonNull
    override fun createViewManagers(@NonNull reactContext: ReactApplicationContext): List<ViewManager<*, *>> {
        return emptyList()
    }
} 