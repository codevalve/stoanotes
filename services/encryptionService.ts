
import { STORAGE_KEYS } from '../constants';

const ITERATIONS = 100000;
const KEY_LENGTH = 256;

export class EncryptionService {
  private static masterKey: CryptoKey | null = null;

  private static arrayBufferToBase64(buffer: ArrayBuffer): string {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return window.btoa(binary);
  }

  private static base64ToArrayBuffer(base64: string): Uint8Array {
    const binaryString = window.atob(base64);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes;
  }

  static async initialize(password: string): Promise<boolean> {
    try {
      let saltStr = localStorage.getItem(STORAGE_KEYS.SALT);
      let salt: Uint8Array;

      if (!saltStr) {
        salt = window.crypto.getRandomValues(new Uint8Array(16));
        localStorage.setItem(STORAGE_KEYS.SALT, this.arrayBufferToBase64(salt));
      } else {
        salt = this.base64ToArrayBuffer(saltStr);
      }

      const encoder = new TextEncoder();
      const baseKey = await window.crypto.subtle.importKey(
        'raw',
        encoder.encode(password),
        'PBKDF2',
        false,
        ['deriveKey']
      );

      this.masterKey = await window.crypto.subtle.deriveKey(
        {
          name: 'PBKDF2',
          salt: salt,
          iterations: ITERATIONS,
          hash: 'SHA-256'
        },
        baseKey,
        { name: 'AES-GCM', length: KEY_LENGTH },
        false,
        ['encrypt', 'decrypt']
      );

      return true;
    } catch (error) {
      console.error('Encryption initialization failed', error);
      this.masterKey = null;
      return false;
    }
  }

  static async encrypt(text: string): Promise<string> {
    if (!this.masterKey) throw new Error('Not initialized');
    
    const iv = window.crypto.getRandomValues(new Uint8Array(12));
    const encoder = new TextEncoder();
    const encrypted = await window.crypto.subtle.encrypt(
      { name: 'AES-GCM', iv },
      this.masterKey,
      encoder.encode(text)
    );

    const combined = new Uint8Array(iv.length + encrypted.byteLength);
    combined.set(iv);
    combined.set(new Uint8Array(encrypted), iv.length);

    return this.arrayBufferToBase64(combined);
  }

  static async decrypt(encryptedBase64: string): Promise<string> {
    if (!this.masterKey) throw new Error('Not initialized');

    try {
      const combined = this.base64ToArrayBuffer(encryptedBase64);
      const iv = combined.slice(0, 12);
      const data = combined.slice(12);

      const decrypted = await window.crypto.subtle.decrypt(
        { name: 'AES-GCM', iv },
        this.masterKey,
        data
      );

      return new TextDecoder().decode(decrypted);
    } catch (e) {
      throw new Error('Decryption failed. Incorrect password?');
    }
  }

  static isLocked(): boolean {
    return this.masterKey === null;
  }

  static logout() {
    this.masterKey = null;
  }
}
