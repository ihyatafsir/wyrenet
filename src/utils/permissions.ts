/**
 * WyreNet Sovereign Permissions Manager
 * Zero emojis. Handles runtime permissions for RECORD_AUDIO, WiFi, Bluetooth, and Mesh Network.
 */

import { PermissionsAndroid, Platform } from 'react-native';

export async function requestAudioPermission(): Promise<boolean> {
  if (Platform.OS !== 'android') return true;
  try {
    const hasPermission = await PermissionsAndroid.check(
      PermissionsAndroid.PERMISSIONS.RECORD_AUDIO
    );
    if (hasPermission) return true;

    const status = await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
      {
        title: 'WyreNet Audio & Microphone Access',
        message: 'WyreNet requires microphone access for offline DTMF acoustic key exchange (Nagham) and P2P voice messages (Sawt).',
        buttonPositive: 'Grant Access',
        buttonNegative: 'Cancel',
      }
    );
    return status === PermissionsAndroid.RESULTS.GRANTED;
  } catch (err) {
    console.warn('[Permissions] RECORD_AUDIO request error:', err);
    return false;
  }
}

export async function checkAudioPermission(): Promise<boolean> {
  if (Platform.OS !== 'android') return true;
  try {
    return await PermissionsAndroid.check(
      PermissionsAndroid.PERMISSIONS.RECORD_AUDIO
    );
  } catch (err) {
    return false;
  }
}

export async function requestMeshPermissions(): Promise<boolean> {
  if (Platform.OS !== 'android') return true;
  try {
    const permissions = [
      PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
      PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
    ];
    if (typeof Platform.Version === 'number' && Platform.Version >= 33) {
      // @ts-ignore
      if (PermissionsAndroid.PERMISSIONS.NEARBY_WIFI_DEVICES) {
        // @ts-ignore
        permissions.push(PermissionsAndroid.PERMISSIONS.NEARBY_WIFI_DEVICES);
      }
    }
    const results = await PermissionsAndroid.requestMultiple(permissions);
    return results[PermissionsAndroid.PERMISSIONS.RECORD_AUDIO] === PermissionsAndroid.RESULTS.GRANTED;
  } catch (err) {
    console.warn('[Permissions] Mesh permissions request error:', err);
    return false;
  }
}
