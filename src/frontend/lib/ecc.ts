// Frontend ECC utilities for key generation and signing

export interface KeyPair {
  publicKey: string;
  privateKey: string;
}

// Generate ECC key pair using Web Crypto API
export async function generateECCKeyPair(): Promise<KeyPair> {
  try {
    // Generate key pair
    const keyPair = await window.crypto.subtle.generateKey(
      {
        name: 'ECDSA',
        namedCurve: 'P-256',
      },
      true,
      ['sign', 'verify']
    );

    // Export private key
    const privateKeyBuffer = await window.crypto.subtle.exportKey(
      'pkcs8',
      keyPair.privateKey
    );
    const privateKey = arrayBufferToBase64(privateKeyBuffer);

    // Export public key
    const publicKeyBuffer = await window.crypto.subtle.exportKey(
      'spki',
      keyPair.publicKey
    );
    const publicKey = arrayBufferToBase64(publicKeyBuffer);

    return {
      publicKey,
      privateKey,
    };
  } catch (error) {
    console.error('Error generating ECC key pair:', error);
    throw new Error('Failed to generate key pair');
  }
}

// Sign a message with the private key
export async function signWithPrivateKey(
  privateKeyBase64: string,
  message: string
): Promise<string> {
  try {
    // Import private key
    const privateKeyBuffer = base64ToArrayBuffer(privateKeyBase64);
    const privateKey = await window.crypto.subtle.importKey(
      'pkcs8',
      privateKeyBuffer,
      {
        name: 'ECDSA',
        namedCurve: 'P-256',
      },
      false,
      ['sign']
    );

    // Sign the message
    const encoder = new TextEncoder();
    const messageBuffer = encoder.encode(message);
    const signatureBuffer = await window.crypto.subtle.sign(
      {
        name: 'ECDSA',
        hash: 'SHA-256',
      },
      privateKey,
      messageBuffer
    );

    // Convert to base64
    const signature = arrayBufferToBase64(signatureBuffer);
    return signature;
  } catch (error) {
    console.error('Error signing message:', error);
    throw new Error('Failed to sign message');
  }
}

// Utility functions for base64 conversion
function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return window.btoa(binary);
}

function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const binaryString = window.atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes.buffer;
}

// Store keys securely in localStorage
export function storeKeys(keyPair: KeyPair): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem('ecc_public_key', keyPair.publicKey);
    localStorage.setItem('ecc_private_key', keyPair.privateKey);
  }
}

// Retrieve stored keys
export function getStoredKeys(): KeyPair | null {
  if (typeof window === 'undefined') return null;

  const publicKey = localStorage.getItem('ecc_public_key');
  const privateKey = localStorage.getItem('ecc_private_key');

  if (publicKey && privateKey) {
    return { publicKey, privateKey };
  }

  return null;
}

// Clear stored keys
export function clearStoredKeys(): void {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('ecc_public_key');
    localStorage.removeItem('ecc_private_key');
  }
}
