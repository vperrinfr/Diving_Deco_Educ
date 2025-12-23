import CryptoJS from 'crypto-js';

/**
 * Encryption utility for sensitive data storage
 * Uses AES encryption for localStorage data
 */

// Use environment variable or fallback (should be set in production)
const SECRET_KEY = import.meta.env.VITE_ENCRYPTION_KEY || 'default-dev-key-change-in-production';

/**
 * Encrypt data before storing
 * @param data - Data to encrypt (will be stringified)
 * @returns Encrypted string
 */
export function encryptData(data: any): string {
  try {
    const jsonString = JSON.stringify(data);
    return CryptoJS.AES.encrypt(jsonString, SECRET_KEY).toString();
  } catch (error) {
    console.error('Encryption error:', error);
    throw new Error('Failed to encrypt data');
  }
}

/**
 * Decrypt data after retrieval
 * @param encryptedData - Encrypted string
 * @returns Decrypted and parsed data
 */
export function decryptData(encryptedData: string): any {
  try {
    const bytes = CryptoJS.AES.decrypt(encryptedData, SECRET_KEY);
    const decryptedString = bytes.toString(CryptoJS.enc.Utf8);
    return JSON.parse(decryptedString);
  } catch (error) {
    console.error('Decryption error:', error);
    throw new Error('Failed to decrypt data');
  }
}

/**
 * Secure localStorage wrapper with encryption
 */
export const secureStorage = {
  /**
   * Set item in localStorage with encryption
   */
  setItem(key: string, value: any): void {
    try {
      const encrypted = encryptData(value);
      localStorage.setItem(key, encrypted);
    } catch (error) {
      console.error('Error storing encrypted data:', error);
      throw error;
    }
  },

  /**
   * Get item from localStorage with decryption
   */
  getItem(key: string): any {
    try {
      const encrypted = localStorage.getItem(key);
      if (!encrypted) return null;
      return decryptData(encrypted);
    } catch (error) {
      console.error('Error retrieving encrypted data:', error);
      // Return null if decryption fails (corrupted data)
      return null;
    }
  },

  /**
   * Remove item from localStorage
   */
  removeItem(key: string): void {
    localStorage.removeItem(key);
  },

  /**
   * Clear all items from localStorage
   */
  clear(): void {
    localStorage.clear();
  }
};

export default secureStorage;

// Made with Bob
