import type { ComprehensiveSkinReport } from '@/features/analysis/types';

const DB_NAME = 'dermalens_local_db';
const DB_VERSION = 1;
const STORE_NAME = 'skin_reports';

interface StoredReportRecord {
  id: string;
  timestamp: string;
  report: ComprehensiveSkinReport;
  photoUrl?: string; // Local ObjectURL / Base64 held only in IndexedDB
}

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      reject(new Error('IndexedDB unavailable'));
      return;
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

// In-memory fallback if IndexedDB is disabled or blocked in private browsing
const memoryStore = new Map<string, ComprehensiveSkinReport>();

/**
 * Saves a skin analysis report locally on device.
 */
export async function saveReportLocally(report: ComprehensiveSkinReport): Promise<void> {
  memoryStore.set(report.id, report);

  try {
    const db = await openDatabase();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readwrite');
      const store = transaction.objectStore(STORE_NAME);

      const record: StoredReportRecord = {
        id: report.id,
        timestamp: report.timestamp,
        report,
      };

      const request = store.put(record);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  } catch {
    // Graceful fallback to memory store
  }
}

/**
 * Retrieves a report by its unique scan ID.
 */
export async function getReportById(id: string): Promise<ComprehensiveSkinReport | null> {
  if (memoryStore.has(id)) {
    return memoryStore.get(id) ?? null;
  }

  try {
    const db = await openDatabase();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.get(id);

      request.onsuccess = () => {
        const record = request.result as StoredReportRecord | undefined;
        resolve(record ? record.report : null);
      };
      request.onerror = () => reject(request.error);
    });
  } catch {
    return null;
  }
}

/**
 * Retrieves all locally saved reports.
 */
export async function getAllLocalReports(): Promise<ComprehensiveSkinReport[]> {
  try {
    const db = await openDatabase();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.getAll();

      request.onsuccess = () => {
        const records = request.result as StoredReportRecord[];
        resolve(records.map((r) => r.report));
      };
      request.onerror = () => reject(request.error);
    });
  } catch {
    return Array.from(memoryStore.values());
  }
}

/**
 * Immediate, non-reversible local data wipe.
 * Purges IndexedDB, localStorage, sessionStorage, and memory buffers.
 */
export async function deleteAllUserData(): Promise<void> {
  memoryStore.clear();

  if (typeof window !== 'undefined') {
    try {
      localStorage.clear();
      sessionStorage.clear();
    } catch {
      // Storage might be restricted
    }

    if (window.indexedDB) {
      try {
        const req = indexedDB.deleteDatabase(DB_NAME);
        await new Promise<void>((resolve) => {
          req.onsuccess = () => resolve();
          req.onerror = () => resolve();
          req.onblocked = () => resolve();
        });
      } catch {
        // Continue
      }
    }
  }
}
