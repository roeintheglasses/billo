package com.billo

import androidx.annotation.NonNull
import com.facebook.react.ReactPackage
import com.facebook.react.bridge.NativeModule
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.uimanager.ViewManager

/**
 * Package for registering the SMSScannerModule native module
 */
class SMSScannerPackage : ReactPackage {
    
    @NonNull
    override fun createNativeModules(@NonNull reactContext: ReactApplicationContext): List<NativeModule> {
        val modules = ArrayList<NativeModule>()
        modules.add(SMSScannerModule(reactContext))
        return modules
    }

    @NonNull
    override fun createViewManagers(@NonNull reactContext: ReactApplicationContext): List<ViewManager<*, *>> {
        return emptyList()
    }
} 