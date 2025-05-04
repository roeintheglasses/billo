import { NativeModules, Platform } from 'react-native';
import logger from '../utils/logger';

// Scan frequency options
export type ScanFrequency = 'low' | 'medium' | 'high';

// Scan status interface
export interface SMSScanStatus {
  isEnabled: boolean;
  frequency: ScanFrequency;
  lastScanTimestamp: number;
}

/**
 * Service for managing the SMS Scanner background service
 */
class SMSScannerService {
  private isAndroid: boolean;

  constructor() {
    this.isAndroid = Platform.OS === 'android';
  }

  /**
   * Check if the service is supported on this device
   */
  isSupported(): boolean {
    return this.isAndroid && !!NativeModules.SMSScannerModule;
  }

  /**
   * Enable SMS scanning with the specified frequency
   *
   * @param frequency The frequency of scanning (low, medium, high)
   */
  async enableScanning(frequency: ScanFrequency = 'medium'): Promise<boolean> {
    try {
      if (!this.isSupported()) {
        logger.warn('SMS scanning is not supported on this device');
        return false;
      }

      return await NativeModules.SMSScannerModule.enableScanning(frequency);
    } catch (error) {
      logger.error('Failed to enable SMS scanning', error);
      return false;
    }
  }

  /**
   * Disable SMS scanning
   */
  async disableScanning(): Promise<boolean> {
    try {
      if (!this.isSupported()) {
        return false;
      }

      return await NativeModules.SMSScannerModule.disableScanning();
    } catch (error) {
      logger.error('Failed to disable SMS scanning', error);
      return false;
    }
  }

  /**
   * Check if SMS scanning is enabled
   */
  async isEnabled(): Promise<boolean> {
    try {
      if (!this.isSupported()) {
        return false;
      }

      return await NativeModules.SMSScannerModule.isEnabled();
    } catch (error) {
      logger.error('Failed to check if SMS scanning is enabled', error);
      return false;
    }
  }

  /**
   * Get the current scan frequency
   */
  async getScanFrequency(): Promise<ScanFrequency> {
    try {
      if (!this.isSupported()) {
        return 'medium';
      }

      return await NativeModules.SMSScannerModule.getScanFrequency();
    } catch (error) {
      logger.error('Failed to get scan frequency', error);
      return 'medium';
    }
  }

  /**
   * Set the scan frequency
   */
  async setScanFrequency(frequency: ScanFrequency): Promise<boolean> {
    try {
      if (!this.isSupported()) {
        return false;
      }

      return await NativeModules.SMSScannerModule.setScanFrequency(frequency);
    } catch (error) {
      logger.error('Failed to set scan frequency', error);
      return false;
    }
  }

  /**
   * Get the timestamp of the last scan
   */
  async getLastScanTimestamp(): Promise<number> {
    try {
      if (!this.isSupported()) {
        return 0;
      }

      return await NativeModules.SMSScannerModule.getLastScanTimestamp();
    } catch (error) {
      logger.error('Failed to get last scan timestamp', error);
      return 0;
    }
  }

  /**
   * Run a manual scan now
   */
  async runManualScan(): Promise<boolean> {
    try {
      if (!this.isSupported()) {
        return false;
      }

      return await NativeModules.SMSScannerModule.runManualScan();
    } catch (error) {
      logger.error('Failed to run manual scan', error);
      return false;
    }
  }

  /**
   * Get scan status (including work state)
   */
  async getScanStatus(): Promise<SMSScanStatus> {
    try {
      if (!this.isSupported()) {
        return {
          isEnabled: false,
          frequency: 'medium',
          lastScanTimestamp: 0,
        };
      }

      return await NativeModules.SMSScannerModule.getScanStatus();
    } catch (error) {
      logger.error('Failed to get scan status', error);
      return {
        isEnabled: false,
        frequency: 'medium',
        lastScanTimestamp: 0,
      };
    }
  }

  /**
   * Get frequency string for display
   */
  getFrequencyDisplayName(frequency: ScanFrequency): string {
    switch (frequency) {
      case 'low':
        return 'Low (Once per hour)';
      case 'medium':
        return 'Medium (Twice per hour)';
      case 'high':
        return 'High (Four times per hour)';
      default:
        return 'Medium (Twice per hour)';
    }
  }
}

export default new SMSScannerService();
