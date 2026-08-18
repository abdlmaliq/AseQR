import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
  signOut,
  onAuthStateChanged,
  type User
} from 'firebase/auth';
import {
  getFirestore,
  doc,
  getDoc,
  setDoc,
  collection,
  getDocs,
  writeBatch,
  deleteDoc,
  onSnapshot
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';
import { UserProfile, ScannedContact, AppSettings, ScanEvent, CustomQRCode } from '../types';
import { DEFAULT_PROFILE } from '../utils/storage';

// Initialize Firebase App singleton
export const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

export const db = firebaseConfig.firestoreDatabaseId
  ? getFirestore(app, firebaseConfig.firestoreDatabaseId)
  : getFirestore(app);

export {
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
  signOut,
  onAuthStateChanged,
  type User,
  collection,
  doc,
  onSnapshot,
};

// Firestore Database Sync Helpers

/**
 * Fetch a user's master profile from Firestore.
 */
export async function fetchCloudProfile(userId: string): Promise<UserProfile | null> {
  try {
    const profileRef = doc(db, 'users', userId, 'profile', 'main');
    const snap = await getDoc(profileRef);
    if (snap.exists()) {
      return snap.data() as UserProfile;
    }
    return null;
  } catch (error) {
    console.error('Error fetching cloud profile:', error);
    return null;
  }
}

/**
 * Save user's master profile to Firestore.
 */
export async function saveCloudProfile(userId: string, profile: UserProfile): Promise<boolean> {
  try {
    const profileRef = doc(db, 'users', userId, 'profile', 'main');
    await setDoc(profileRef, {
      ...profile,
      updatedAt: new Date().toISOString(),
    }, { merge: true });
    return true;
  } catch (error) {
    console.error('Error saving cloud profile:', error);
    return false;
  }
}

/**
 * Fetch all saved contacts for a user from Firestore.
 */
export async function fetchCloudContacts(userId: string): Promise<ScannedContact[]> {
  try {
    const contactsCol = collection(db, 'users', userId, 'contacts');
    const snap = await getDocs(contactsCol);
    const list: ScannedContact[] = [];
    snap.forEach((d) => {
      list.push(d.data() as ScannedContact);
    });
    // Sort by scannedAt desc
    return list.sort((a, b) => new Date(b.scannedAt).getTime() - new Date(a.scannedAt).getTime());
  } catch (error) {
    console.error('Error fetching cloud contacts:', error);
    return [];
  }
}

/**
 * Save a single contact to Firestore.
 */
export async function saveCloudContact(userId: string, contact: ScannedContact): Promise<boolean> {
  try {
    const contactRef = doc(db, 'users', userId, 'contacts', contact.id);
    await setDoc(contactRef, contact, { merge: true });
    return true;
  } catch (error) {
    console.error('Error saving cloud contact:', error);
    return false;
  }
}

/**
 * Delete a contact from Firestore.
 */
export async function deleteCloudContact(userId: string, contactId: string): Promise<boolean> {
  try {
    const contactRef = doc(db, 'users', userId, 'contacts', contactId);
    await deleteDoc(contactRef);
    return true;
  } catch (error) {
    console.error('Error deleting cloud contact:', error);
    return false;
  }
}

/**
 * Fetch settings for a user from Firestore.
 */
export async function fetchCloudSettings(userId: string): Promise<AppSettings | null> {
  try {
    const settingsRef = doc(db, 'users', userId, 'settings', 'main');
    const snap = await getDoc(settingsRef);
    if (snap.exists()) {
      return snap.data() as AppSettings;
    }
    return null;
  } catch (error) {
    console.error('Error fetching cloud settings:', error);
    return null;
  }
}

/**
 * Save settings for a user to Firestore.
 */
export async function saveCloudSettings(userId: string, settings: AppSettings): Promise<boolean> {
  try {
    const settingsRef = doc(db, 'users', userId, 'settings', 'main');
    await setDoc(settingsRef, settings, { merge: true });
    return true;
  } catch (error) {
    console.error('Error saving cloud settings:', error);
    return false;
  }
}

/**
 * Fetch all logged QR scan events for a user from Firestore.
 */
export async function fetchCloudScans(userId: string): Promise<ScanEvent[]> {
  try {
    const scansCol = collection(db, 'users', userId, 'scans');
    const snap = await getDocs(scansCol);
    const list: ScanEvent[] = [];
    snap.forEach((d) => {
      list.push(d.data() as ScanEvent);
    });
    // Sort by scannedAt desc
    return list.sort((a, b) => new Date(b.scannedAt).getTime() - new Date(a.scannedAt).getTime());
  } catch (error) {
    console.error('Error fetching cloud scans:', error);
    return [];
  }
}

/**
 * Save a new scan event to Firestore.
 */
export async function saveCloudScan(userId: string, scan: ScanEvent): Promise<boolean> {
  try {
    const scanRef = doc(db, 'users', userId, 'scans', scan.id);
    await setDoc(scanRef, scan, { merge: true });
    return true;
  } catch (error) {
    console.error('Error saving cloud scan:', error);
    return false;
  }
}

/**
 * Record an interaction action taken by the scanner on the public profile.
 */
export async function logScanActionCloud(userId: string, scanId: string, action: string): Promise<boolean> {
  try {
    const scanRef = doc(db, 'users', userId, 'scans', scanId);
    const snap = await getDoc(scanRef);
    if (snap.exists()) {
      const data = snap.data() as ScanEvent;
      const currentActions = Array.isArray(data.actionsTaken) ? data.actionsTaken : [];
      if (!currentActions.includes(action)) {
        await setDoc(scanRef, {
          actionsTaken: [...currentActions, action],
          lastActiveAt: new Date().toISOString(),
        }, { merge: true });
      }
    }
    return true;
  } catch (error) {
    console.error('Error recording scan action:', error);
    return false;
  }
}

/**
 * Delete a scan event record.
 */
export async function deleteCloudScan(userId: string, scanId: string): Promise<boolean> {
  try {
    const scanRef = doc(db, 'users', userId, 'scans', scanId);
    await deleteDoc(scanRef);
    return true;
  } catch (error) {
    console.error('Error deleting cloud scan:', error);
    return false;
  }
}

/**
 * Clear all scan analytics logs for a user.
 */
export async function clearCloudScans(userId: string): Promise<boolean> {
  try {
    const scansCol = collection(db, 'users', userId, 'scans');
    const snap = await getDocs(scansCol);
    const batch = writeBatch(db);
    snap.forEach((d) => {
      batch.delete(d.ref);
    });
    await batch.commit();
    return true;
  } catch (error) {
    console.error('Error clearing cloud scans:', error);
    return false;
  }
}

/**
 * Fetch all custom generated QR codes for a user from Firestore.
 */
export async function fetchCloudCustomQRs(userId: string): Promise<CustomQRCode[]> {
  try {
    const qrsCol = collection(db, 'users', userId, 'customQRs');
    const snap = await getDocs(qrsCol);
    const list: CustomQRCode[] = [];
    snap.forEach((d) => {
      list.push(d.data() as CustomQRCode);
    });
    return list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  } catch (error) {
    console.error('Error fetching cloud custom QRs:', error);
    return [];
  }
}

/**
 * Save or update a custom QR code in Firestore.
 */
export async function saveCloudCustomQR(userId: string, qrCode: CustomQRCode): Promise<boolean> {
  try {
    const qrRef = doc(db, 'users', userId, 'customQRs', qrCode.id);
    await setDoc(qrRef, qrCode, { merge: true });
    return true;
  } catch (error) {
    console.error('Error saving cloud custom QR:', error);
    return false;
  }
}

/**
 * Delete a custom QR code from Firestore.
 */
export async function deleteCloudCustomQR(userId: string, qrId: string): Promise<boolean> {
  try {
    const qrRef = doc(db, 'users', userId, 'customQRs', qrId);
    await deleteDoc(qrRef);
    return true;
  } catch (error) {
    console.error('Error deleting cloud custom QR:', error);
    return false;
  }
}

/**
 * Clear all custom QR codes for a user.
 */
export async function clearCloudCustomQRs(userId: string): Promise<boolean> {
  try {
    const qrsCol = collection(db, 'users', userId, 'customQRs');
    const snap = await getDocs(qrsCol);
    const batch = writeBatch(db);
    snap.forEach((d) => {
      batch.delete(d.ref);
    });
    await batch.commit();
    return true;
  } catch (error) {
    console.error('Error clearing cloud custom QRs:', error);
    return false;
  }
}


