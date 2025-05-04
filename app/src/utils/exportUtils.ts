import { Platform, Share } from 'react-native';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { format } from 'date-fns';
import { formatCurrency } from './formatUtils';

/**
 * Converts data to CSV format
 * @param data Array of objects to convert to CSV
 * @param headers Optional custom headers for the CSV
 * @returns CSV formatted string
 */
export const convertToCSV = <T extends Record<string, any>>(
  data: T[],
  headers?: { [K in keyof T]?: string }
): string => {
  if (data.length === 0) {
    return '';
  }

  // Use the first object's keys as column headers if not provided
  const keys = Object.keys(data[0]) as (keyof T)[];
  const headerRow = keys.map(key => headers?.[key] || String(key)).join(',');

  // Convert each object to a CSV row
  const rows = data.map(obj => {
    return keys.map(key => {
      // Handle special cases like dates, numbers, etc.
      const value = obj[key];
      if (value === null || value === undefined) {
        return '';
      }
      if (typeof value === 'string') {
        // Escape quotes and wrap in quotes if it contains commas or quotes
        if (value.includes(',') || value.includes('"')) {
          return `"${value.replace(/"/g, '""')}"`;
        }
        return value;
      }
      return String(value);
    }).join(',');
  });

  return [headerRow, ...rows].join('\n');
};

/**
 * Format monthly spending data for export
 * @param data Spending time series data
 * @returns Formatted data suitable for export
 */
export const formatSpendingDataForExport = (
  data: { month: string; amount: number }[]
): { Month: string; Amount: string }[] => {
  return data.map(({ month, amount }) => ({
    Month: format(new Date(month), 'MMMM yyyy'),
    Amount: formatCurrency(amount)
  }));
};

/**
 * Exports data as a CSV file and shares it
 * @param data Data to export
 * @param filename Name of the exported file
 * @param headers Optional custom headers for the CSV columns
 * @returns Promise that resolves when the export is complete
 */
export const exportDataAsCSV = async <T extends Record<string, any>>(
  data: T[],
  filename: string,
  headers?: { [K in keyof T]?: string }
): Promise<void> => {
  try {
    if (data.length === 0) {
      throw new Error('No data to export');
    }

    const csvContent = convertToCSV(data, headers);
    const csvFilename = `${filename}-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    
    if (Platform.OS === 'web') {
      // For web, create a downloadable link
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', csvFilename);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else {
      // For mobile, use FileSystem and Sharing
      const fileUri = `${FileSystem.documentDirectory}${csvFilename}`;
      await FileSystem.writeAsStringAsync(fileUri, csvContent);
      
      if (Platform.OS === 'ios') {
        // iOS can use Share
        await Share.share({
          url: fileUri,
          title: 'Monthly Spending Data'
        });
      } else if (Platform.OS === 'android') {
        // Android needs expo-sharing
        if (await Sharing.isAvailableAsync()) {
          await Sharing.shareAsync(fileUri, { 
            mimeType: 'text/csv',
            dialogTitle: 'Export Monthly Spending Data'
          });
        } else {
          throw new Error('Sharing is not available on this device');
        }
      }
    }
  } catch (error) {
    console.error('Failed to export data:', error);
    throw error;
  }
};

export default {
  convertToCSV,
  exportDataAsCSV,
  formatSpendingDataForExport,
}; 