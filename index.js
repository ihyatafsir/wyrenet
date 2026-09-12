// 1. Mandatory crypto polyfills - MUST BE FIRST
import 'react-native-get-random-values';
import { Buffer } from 'buffer';

// 2. Global Environment Polyfills for Hermes / JSC
if (typeof global.Buffer === 'undefined') {
  global.Buffer = Buffer;
}

class PolyfillTextEncoder {
  encode(str) {
    if (typeof str !== 'string') str = String(str || '');
    const utf8 = unescape(encodeURIComponent(str));
    const result = new Uint8Array(utf8.length);
    for (let i = 0; i < utf8.length; i++) {
      result[i] = utf8.charCodeAt(i);
    }
    return result;
  }
}

class PolyfillTextDecoder {
  decode(bytes) {
    if (!bytes || bytes.length === 0) return '';
    let utf8 = '';
    const arr = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
    for (let i = 0; i < arr.length; i++) {
      utf8 += String.fromCharCode(arr[i]);
    }
    try {
      return decodeURIComponent(escape(utf8));
    } catch (e) {
      return utf8;
    }
  }
}

if (typeof global.TextEncoder === 'undefined') {
  global.TextEncoder = PolyfillTextEncoder;
}
if (typeof global.TextDecoder === 'undefined') {
  global.TextDecoder = PolyfillTextDecoder;
}

if (typeof global.process === 'undefined') {
  global.process = { env: {} };
}

if (typeof global.crypto === 'undefined') {
  global.crypto = {};
}

if (!global.crypto.getRandomValues) {
  global.crypto.getRandomValues = function (typedArray) {
    for (let i = 0; i < typedArray.length; i++) {
      typedArray[i] = Math.floor(Math.random() * 256);
    }
    return typedArray;
  };
}

// 3. Global Error Protection
if (global.ErrorUtils && typeof global.ErrorUtils.setGlobalHandler === 'function') {
  const defaultHandler = global.ErrorUtils.getGlobalHandler();
  global.ErrorUtils.setGlobalHandler((error, isFatal) => {
    console.error('[WyreNet Global Error Shield]:', error, 'isFatal:', isFatal);
    if (!isFatal && defaultHandler) {
      defaultHandler(error, isFatal);
    }
  });
}

// 4. Register Main Application Component with Multi-Key Aliases
import { AppRegistry } from 'react-native';
import App from './App';
import { name as appName } from './app.json';

AppRegistry.registerComponent(appName, () => App);
AppRegistry.registerComponent('WyreNet', () => App);
AppRegistry.registerComponent('WyreSup', () => App);
AppRegistry.registerComponent('com.wyrenet.mesh', () => App);
AppRegistry.registerComponent('com.wyresup.app', () => App);
AppRegistry.registerComponent('main', () => App);
