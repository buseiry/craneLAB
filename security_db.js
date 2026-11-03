/**
 * CraneLab: ASVAM-Pulse - Security & IndexedDB Engine
 * TETFund - Tenstar Simulator Training Initiative
 * Consortium: ASQ Development & Training UK / SAMMAX Global Services
 *
 * Architecture:
 * - Web Crypto API HMAC-SHA256 session token generation and tamper detection.
 * - IndexedDB storage wrapper with ACID transactions for offline resilience.
 */

// # State Block: Global Security & Database Configuration Constants
const CRANELAB_CONFIG = {
  DB_NAME: 'CraneLab_ASVAM_Pulse_DB',
  DB_VERSION: 1,
  DEFAULT_SALT: 'TETFUND-TENSTAR-ASVAM-2026-UK-SAMMAX-SECURE-KEY',
  STORES: {
    CANDIDATE_PROFILE: 'candidate_profile',
    WORKBOOK_ANSWERS: 'workbook_answers',
    TELEMETRY_LOGS: 'telemetry_logs',
    SYNC_QUEUE: 'sync_queue'
  }
};

// # Class: CraneLabSecurity - Stateless Web Crypto API Cryptographic Subsystem
class CraneLabSecurity {
  // # Function: Convert string to UTF-8 Uint8Array buffer
  static stringToBuffer(str) {
    const encoder = new TextEncoder();
    return encoder.encode(str);
  }

  // # Function: Convert ArrayBuffer to Hexadecimal String
  static bufferToHex(buffer) {
    const byteView = new Uint8Array(buffer);
    let hexString = '';
    for (let i = 0; i < byteView.length; i++) {
      const hex = byteView[i].toString(16).padStart(2, '0');
      hexString += hex;
    }
    return hexString;
  }

  // # Function: Stateless SHA-256 HMAC session token generator using Web Crypto API
  // # Equation: Token = HMAC-SHA256(Message = Candidate_ID + "::" + Cohort_Group + "::" + Timestamp, Key = Secret_Salt)
  static async generateSessionToken(candidateId, cohortGroup, timestamp, secretSalt = CRANELAB_CONFIG.DEFAULT_SALT) {
    // # State Block: Validate input parameters before cryptographic derivation
    if (!candidateId || !cohortGroup || !timestamp) {
      throw new Error('Security Error: candidateId, cohortGroup, and timestamp are required for token synthesis');
    }

    const salt = secretSalt && secretSalt.trim().length > 0 ? secretSalt : CRANELAB_CONFIG.DEFAULT_SALT;
    const message = `${candidateId.trim().toUpperCase()}::${cohortGroup.trim()}::${timestamp}`;

    try {
      // # State Block: Cryptographic Key Import via Web Crypto Subtle API
      const keyData = this.stringToBuffer(salt);
      const cryptoKey = await window.crypto.subtle.importKey(
        'raw',
        keyData,
        { name: 'HMAC', hash: { name: 'SHA-256' } },
        false,
        ['sign']
      );

      // # Equation: Digital signature calculation over message buffer
      const messageData = this.stringToBuffer(message);
      const signatureBuffer = await window.crypto.subtle.sign('HMAC', cryptoKey, messageData);
      
      // # Return: Standardized 64-character uppercase hexadecimal HMAC digest
      return this.bufferToHex(signatureBuffer).toUpperCase();
    } catch (cryptoErr) {
      // # Fallback Math Block: Direct SHA-256 Digest if HMAC import is restricted
      console.warn('HMAC sign fallback to SHA-256 digest:', cryptoErr);
      const combinedPayload = `${message}::${salt}`;
      const payloadBuffer = this.stringToBuffer(combinedPayload);
      const digestBuffer = await window.crypto.subtle.digest('SHA-256', payloadBuffer);
      return this.bufferToHex(digestBuffer).toUpperCase();
    }
  }

  // # Function: Verify session token authenticity against Candidate and Cohort coordinates
  static async verifySessionToken(candidateId, cohortGroup, timestamp, token, secretSalt = CRANELAB_CONFIG.DEFAULT_SALT) {
    // # State Block: Re-derive expected token under identical parameters
    const expectedToken = await this.generateSessionToken(candidateId, cohortGroup, timestamp, secretSalt);
    // # Equation: Constant-time string equivalence comparison to mitigate side-channel timing attacks
    if (expectedToken.length !== token.length) {
      return false;
    }
    let diff = 0;
    for (let i = 0; i < expectedToken.length; i++) {
      diff |= expectedToken.charCodeAt(i) ^ token.charCodeAt(i);
    }
    return diff === 0;
  }

  // # Function: Compute Cryptographic Checksum for Telemetry Log Entry
  // # Equation: Checksum = SHA-256(Session_Token + "::" + Timestamp + "::" + Canonical_Payload)
  static async computeTelemetrySignature(sessionToken, timestamp, payload) {
    const canonicalPayload = typeof payload === 'string' ? payload : JSON.stringify(payload);
    const signaturePreimage = `${sessionToken}::${timestamp}::${canonicalPayload}`;
    const preimageBuffer = this.stringToBuffer(signaturePreimage);
    const digestBuffer = await window.crypto.subtle.digest('SHA-256', preimageBuffer);
    return this.bufferToHex(digestBuffer).toUpperCase();
  }

  // # Function: Audit Telemetry Record Integrity to prevent client-side score modification
  static async verifyTelemetryIntegrity(telemetryRecord) {
    // # State Block: Extract critical record fields
    const { sessionToken, timestamp, payload, signature } = telemetryRecord;
    if (!sessionToken || !timestamp || !signature) {
      return false;
    }
    const computedSignature = await this.computeTelemetrySignature(sessionToken, timestamp, payload);
    return computedSignature === signature;
  }
}

// # Class: CraneLabDB - Native IndexedDB Transactional Storage Engine
class CraneLabDB {
  // # Function: Constructor initializing internal database state
  constructor() {
    // # State Block: Internal database instance and connection status
    this.db = null;
    this.isInitialized = false;
  }

  // # Function: Initialize IndexedDB connection with structured schema migrations
  async init() {
    if (this.isInitialized && this.db) {
      return this.db;
    }

    return new Promise((resolve, reject) => {
      // # State Block: Request open connection to CraneLab IndexedDB
      const request = indexedDB.open(CRANELAB_CONFIG.DB_NAME, CRANELAB_CONFIG.DB_VERSION);

      // # Function: IndexedDB schema definition and object store upgrade trigger
      request.onupgradeneeded = (event) => {
        const db = event.target.result;

        // # Store 1: candidate_profile (Key: candidateId)
        if (!db.objectStoreNames.contains(CRANELAB_CONFIG.STORES.CANDIDATE_PROFILE)) {
          const profileStore = db.createObjectStore(CRANELAB_CONFIG.STORES.CANDIDATE_PROFILE, {
            keyPath: 'candidateId'
          });
          profileStore.createIndex('cohortGroup', 'cohortGroup', { unique: false });
          profileStore.createIndex('sessionToken', 'sessionToken', { unique: false });
          profileStore.createIndex('lastLoginTimestamp', 'lastLoginTimestamp', { unique: false });
        }

        // # Store 2: workbook_answers (Key: id autoincrement)
        if (!db.objectStoreNames.contains(CRANELAB_CONFIG.STORES.WORKBOOK_ANSWERS)) {
          const workbookStore = db.createObjectStore(CRANELAB_CONFIG.STORES.WORKBOOK_ANSWERS, {
            keyPath: 'id',
            autoIncrement: true
          });
          workbookStore.createIndex('candidateId', 'candidateId', { unique: false });
          workbookStore.createIndex('questionId', 'questionId', { unique: false });
          workbookStore.createIndex('sessionToken', 'sessionToken', { unique: false });
          workbookStore.createIndex('submittedAt', 'submittedAt', { unique: false });
        }

        // # Store 3: telemetry_logs (Key: id autoincrement)
        if (!db.objectStoreNames.contains(CRANELAB_CONFIG.STORES.TELEMETRY_LOGS)) {
          const telemetryStore = db.createObjectStore(CRANELAB_CONFIG.STORES.TELEMETRY_LOGS, {
            keyPath: 'id',
            autoIncrement: true
          });
          telemetryStore.createIndex('candidateId', 'candidateId', { unique: false });
          telemetryStore.createIndex('sessionToken', 'sessionToken', { unique: false });
          telemetryStore.createIndex('timestamp', 'timestamp', { unique: false });
          telemetryStore.createIndex('eventType', 'eventType', { unique: false });
          telemetryStore.createIndex('signature', 'signature', { unique: false });
        }

        // # Store 4: sync_queue (Key: queueId autoincrement)
        if (!db.objectStoreNames.contains(CRANELAB_CONFIG.STORES.SYNC_QUEUE)) {
          const syncStore = db.createObjectStore(CRANELAB_CONFIG.STORES.SYNC_QUEUE, {
            keyPath: 'queueId',
            autoIncrement: true
          });
          syncStore.createIndex('candidateId', 'candidateId', { unique: false });
          syncStore.createIndex('status', 'status', { unique: false });
          syncStore.createIndex('createdAt', 'createdAt', { unique: false });
          syncStore.createIndex('endpoint', 'endpoint', { unique: false });
        }
      };

      // # Function: Success handler binding database instance
      request.onsuccess = (event) => {
        this.db = event.target.result;
        this.isInitialized = true;
        resolve(this.db);
      };

      // # Function: Error handler reporting failure
      request.onerror = (event) => {
        reject(new Error(`IndexedDB Open Failure: ${event.target.error}`));
      };
    });
  }

  // # Function: Helper for executing ACID transaction with automated promise resolution
  async executeTransaction(storeName, mode, callback) {
    await this.init();
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(storeName, mode);
      const store = transaction.objectStore(storeName);

      let result = null;

      transaction.oncomplete = () => {
        resolve(result);
      };

      transaction.onerror = (event) => {
        reject(event.target.error);
      };

      try {
        result = callback(store);
      } catch (err) {
        transaction.abort();
        reject(err);
      }
    });
  }

  // ==========================================
  // # SECTION: Candidate Profile Operations
  // ==========================================

  // # Function: Persist or update Candidate Profile in candidate_profile store
  async saveCandidateProfile(profile) {
    if (!profile || !profile.candidateId) {
      throw new Error('Profile must include candidateId as primary key');
    }
    const cleanProfile = {
      ...profile,
      candidateId: profile.candidateId.trim().toUpperCase(),
      updatedAt: new Date().toISOString()
    };

    return this.executeTransaction(
      CRANELAB_CONFIG.STORES.CANDIDATE_PROFILE,
      'readwrite',
      (store) => {
        const req = store.put(cleanProfile);
        return new Promise((res, rej) => {
          req.onsuccess = () => res(cleanProfile);
          req.onerror = () => rej(req.error);
        });
      }
    );
  }

  // # Function: Retrieve Candidate Profile by primary key candidateId
  async getCandidateProfile(candidateId) {
    const sanitizedId = candidateId.trim().toUpperCase();
    return this.executeTransaction(
      CRANELAB_CONFIG.STORES.CANDIDATE_PROFILE,
      'readonly',
      (store) => {
        const req = store.get(sanitizedId);
        return new Promise((res, rej) => {
          req.onsuccess = () => res(req.result || null);
          req.onerror = () => rej(req.error);
        });
      }
    );
  }

  // # Function: List all registered candidate profiles
  async getAllCandidates() {
    return this.executeTransaction(
      CRANELAB_CONFIG.STORES.CANDIDATE_PROFILE,
      'readonly',
      (store) => {
        const req = store.getAll();
        return new Promise((res, rej) => {
          req.onsuccess = () => res(req.result || []);
          req.onerror = () => rej(req.error);
        });
      }
    );
  }

  // ==========================================
  // # SECTION: ASVAM Workbook Answers Operations
  // ==========================================

  // # Function: Save an individual ASVAM inspection or technical workbook answer
  async saveWorkbookAnswer(answerRecord) {
    // # State Block: Validate required record elements
    if (!answerRecord.candidateId || !answerRecord.questionId) {
      throw new Error('Workbook answer requires candidateId and questionId');
    }

    const record = {
      ...answerRecord,
      candidateId: answerRecord.candidateId.trim().toUpperCase(),
      submittedAt: answerRecord.submittedAt || new Date().toISOString()
    };

    return this.executeTransaction(
      CRANELAB_CONFIG.STORES.WORKBOOK_ANSWERS,
      'readwrite',
      (store) => {
        const req = store.add(record);
        return new Promise((res, rej) => {
          req.onsuccess = () => res({ ...record, id: req.result });
          req.onerror = () => rej(req.error);
        });
      }
    );
  }

  // # Function: Retrieve all workbook answers associated with a specific candidate
  async getWorkbookAnswersByCandidate(candidateId) {
    const sanitizedId = candidateId.trim().toUpperCase();
    return this.executeTransaction(
      CRANELAB_CONFIG.STORES.WORKBOOK_ANSWERS,
      'readonly',
      (store) => {
        const index = store.index('candidateId');
        const req = index.getAll(sanitizedId);
        return new Promise((res, rej) => {
          req.onsuccess = () => res(req.result || []);
          req.onerror = () => rej(req.error);
        });
      }
    );
  }

  // ==========================================
  // # SECTION: Telemetry Logs Operations
  // ==========================================

  // # Function: Append authenticated Telemetry log entry with cryptographic signature
  async logTelemetry(candidateId, sessionToken, eventType, telemetryPayload) {
    const timestamp = Date.now();
    // # Equation: Cryptographic digital signature generated over payload
    const signature = await CraneLabSecurity.computeTelemetrySignature(
      sessionToken,
      timestamp,
      telemetryPayload
    );

    const logEntry = {
      candidateId: candidateId.trim().toUpperCase(),
      sessionToken,
      timestamp,
      eventType,
      payload: telemetryPayload,
      signature,
      isoDate: new Date(timestamp).toISOString()
    };

    return this.executeTransaction(
      CRANELAB_CONFIG.STORES.TELEMETRY_LOGS,
      'readwrite',
      (store) => {
        const req = store.add(logEntry);
        return new Promise((res, rej) => {
          req.onsuccess = () => res({ ...logEntry, id: req.result });
          req.onerror = () => rej(req.error);
        });
      }
    );
  }

  // # Function: Fetch Telemetry logs by Candidate ID with optional limit
  async getTelemetryLogs(candidateId, limit = 100) {
    const sanitizedId = candidateId.trim().toUpperCase();
    return this.executeTransaction(
      CRANELAB_CONFIG.STORES.TELEMETRY_LOGS,
      'readonly',
      (store) => {
        const index = store.index('candidateId');
        const req = index.getAll(sanitizedId);
        return new Promise((res, rej) => {
          req.onsuccess = () => {
            const results = req.result || [];
            // # State Block: Sort descending by timestamp and slice to limit
            results.sort((a, b) => b.timestamp - a.timestamp);
            res(results.slice(0, limit));
          };
          req.onerror = () => rej(req.error);
        });
      }
    );
  }

  // ==========================================
  // # SECTION: Offline Sync Queue Operations
  // ==========================================

  // # Function: Enqueue record to sync_queue for upload when network connectivity resumes
  async enqueueSyncItem(candidateId, endpoint, payload, sessionToken) {
    const timestamp = Date.now();
    const signature = await CraneLabSecurity.computeTelemetrySignature(
      sessionToken,
      timestamp,
      payload
    );

    const queueItem = {
      candidateId: candidateId.trim().toUpperCase(),
      endpoint,
      payload,
      sessionToken,
      signature,
      status: 'PENDING', // # States: PENDING | IN_TRANSIT | SYNCED | FAILED
      retryCount: 0,
      createdAt: timestamp,
      isoDate: new Date(timestamp).toISOString()
    };

    return this.executeTransaction(
      CRANELAB_CONFIG.STORES.SYNC_QUEUE,
      'readwrite',
      (store) => {
        const req = store.add(queueItem);
        return new Promise((res, rej) => {
          req.onsuccess = () => res({ ...queueItem, queueId: req.result });
          req.onerror = () => rej(req.error);
        });
      }
    );
  }

  // # Function: Retrieve all pending items in sync_queue
  async getPendingSyncQueue() {
    return this.executeTransaction(
      CRANELAB_CONFIG.STORES.SYNC_QUEUE,
      'readonly',
      (store) => {
        const index = store.index('status');
        const req = index.getAll('PENDING');
        return new Promise((res, rej) => {
          req.onsuccess = () => res(req.result || []);
          req.onerror = () => rej(req.error);
        });
      }
    );
  }

  // # Function: Update status of an individual item in sync_queue
  async updateSyncItemStatus(queueId, status, lastError = null) {
    return this.executeTransaction(
      CRANELAB_CONFIG.STORES.SYNC_QUEUE,
      'readwrite',
      (store) => {
        const getReq = store.get(queueId);
        return new Promise((res, rej) => {
          getReq.onsuccess = () => {
            const item = getReq.result;
            if (!item) {
              return rej(new Error(`Queue item ${queueId} not found`));
            }
            item.status = status;
            item.updatedAt = Date.now();
            if (lastError) item.lastError = lastError;
            if (status === 'FAILED') item.retryCount = (item.retryCount || 0) + 1;

            const putReq = store.put(item);
            putReq.onsuccess = () => res(item);
            putReq.onerror = () => rej(putReq.error);
          };
          getReq.onerror = () => rej(getReq.error);
        });
      }
    );
  }

  // # Function: Purge local database stores (Used for secure terminal logout or session reset)
  async clearAllData() {
    await this.init();
    const stores = Object.values(CRANELAB_CONFIG.STORES);
    const promises = stores.map((storeName) => {
      return this.executeTransaction(storeName, 'readwrite', (store) => {
        const req = store.clear();
        return new Promise((res, rej) => {
          req.onsuccess = () => res();
          req.onerror = () => rej(req.error);
        });
      });
    });
    return Promise.all(promises);
  }
}

// # State Block: Instantiate Singleton Global Instances for browser runtime
window.CraneLabSecurity = CraneLabSecurity;
window.CraneLabDB = new CraneLabDB();

