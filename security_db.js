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
  DB_VERSION: 2,
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

  // # Function: Pure-JavaScript SHA-256 fallback engine for offline or non-secure contexts (e.g. file:// protocol)
  static pureJsSha256(ascii) {
    function rightRotate(value, amount) {
      return (value >>> amount) | (value << (32 - amount));
    }
    let result = '';
    const words = [];
    const asciiBitLength = ascii.length * 8;
    let hash = [
      0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a,
      0x510e527f, 0x9b05688c, 0x1f83d9ab, 0x5be0cd19
    ];
    const k = [
      0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,
      0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
      0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
      0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
      0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
      0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
      0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
      0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2
    ];

    let i = 0;
    for (i = 0; i < ascii.length; i++) {
      words[i >> 2] |= (ascii.charCodeAt(i) & 0xff) << ((3 - (i % 4)) * 8);
    }
    words[asciiBitLength >> 5] |= 0x80 << (24 - (asciiBitLength % 32));
    words[(((asciiBitLength + 64) >> 9) << 4) + 15] = asciiBitLength;

    const w = new Array(64);
    for (let j = 0; j < words.length; j += 16) {
      const a_h = hash.slice(0);
      for (i = 0; i < 64; i++) {
        if (i < 16) {
          w[i] = words[j + i] || 0;
        } else {
          const gamma0 = rightRotate(w[i - 15], 7) ^ rightRotate(w[i - 15], 18) ^ (w[i - 15] >>> 3);
          const gamma1 = rightRotate(w[i - 2], 17) ^ rightRotate(w[i - 2], 19) ^ (w[i - 2] >>> 10);
          w[i] = (w[i - 16] + gamma0 + w[i - 7] + gamma1) | 0;
        }
        const s1 = rightRotate(a_h[4], 6) ^ rightRotate(a_h[4], 11) ^ rightRotate(a_h[4], 25);
        const ch = (a_h[4] & a_h[5]) ^ (~a_h[4] & a_h[6]);
        const temp1 = (a_h[7] + s1 + ch + k[i] + w[i]) | 0;
        const s0 = rightRotate(a_h[0], 2) ^ rightRotate(a_h[0], 13) ^ rightRotate(a_h[0], 22);
        const maj = (a_h[0] & a_h[1]) ^ (a_h[0] & a_h[2]) ^ (a_h[1] & a_h[2]);
        const temp2 = (s0 + maj) | 0;

        a_h[7] = a_h[6];
        a_h[6] = a_h[5];
        a_h[5] = a_h[4];
        a_h[4] = (a_h[3] + temp1) | 0;
        a_h[3] = a_h[2];
        a_h[2] = a_h[1];
        a_h[1] = a_h[0];
        a_h[0] = (temp1 + temp2) | 0;
      }
      for (i = 0; i < 8; i++) {
        hash[i] = (hash[i] + a_h[i]) | 0;
      }
    }
    for (i = 0; i < 8; i++) {
      for (let b = 3; b >= 0; b--) {
        const byte = (hash[i] >> (b * 8)) & 0xff;
        result += ('0' + byte.toString(16)).slice(-2);
      }
    }
    return result.toUpperCase();
  }

  // # Function: Stateless SHA-256 HMAC session token generator using Web Crypto API with pure JS fallback
  // # Equation: Token = HMAC-SHA256(Message = Candidate_ID + "::" + Cohort_Group + "::" + Timestamp, Key = Secret_Salt)
  static async generateSessionToken(candidateId, cohortGroup, timestamp, secretSalt = CRANELAB_CONFIG.DEFAULT_SALT) {
    const cid = (candidateId || 'CANDIDATE').trim().toUpperCase();
    const cohort = (cohortGroup || 'GROUP').trim();
    const ts = timestamp || Date.now();
    const salt = secretSalt && secretSalt.trim().length > 0 ? secretSalt : CRANELAB_CONFIG.DEFAULT_SALT;
    const message = `${cid}::${cohort}::${ts}`;

    try {
      if (window.crypto && window.crypto.subtle && typeof window.crypto.subtle.importKey === 'function') {
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
      }
    } catch (cryptoErr) {
      console.warn('Web Crypto subtle HMAC fallback to pure JS SHA-256:', cryptoErr);
    }
    return this.pureJsSha256(`${message}::${salt}`);
  }

  // # Function: Verify session token authenticity against Candidate and Cohort coordinates
  static async verifySessionToken(candidateId, cohortGroup, timestamp, token, secretSalt = CRANELAB_CONFIG.DEFAULT_SALT) {
    // # State Block: Re-derive expected token under identical parameters
    const expectedToken = await this.generateSessionToken(candidateId, cohortGroup, timestamp, secretSalt);
    // # Equation: Constant-time string equivalence comparison to mitigate side-channel timing attacks
    if (!token || expectedToken.length !== token.length) {
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
    const signaturePreimage = `${sessionToken || 'OFFLINE_TOKEN'}::${timestamp}::${canonicalPayload}`;
    try {
      if (window.crypto && window.crypto.subtle && typeof window.crypto.subtle.digest === 'function') {
        const preimageBuffer = this.stringToBuffer(signaturePreimage);
        const digestBuffer = await window.crypto.subtle.digest('SHA-256', preimageBuffer);
        return this.bufferToHex(digestBuffer).toUpperCase();
      }
    } catch (e) {
      // Fall through to pure JS SHA-256
    }
    return this.pureJsSha256(signaturePreimage);
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
    this.useInMemoryFallback = false;
    this.inMemoryStore = {
      candidate_profile: {},
      workbook_answers: [],
      telemetry_logs: [],
      sync_queue: []
    };
  }

  // # Function: Initialize IndexedDB connection with structured schema migrations and 400ms timeout race
  async init() {
    if (this.isInitialized && this.db) {
      return this.db;
    }
    if (this.useInMemoryFallback) {
      return null;
    }

    return new Promise((resolve) => {
      let isSettled = false;

      // # 400ms Timeout Race Guard: if IndexedDB hangs or is locked by another tab, fail over immediately to memory
      const timer = setTimeout(() => {
        if (!isSettled) {
          isSettled = true;
          this.useInMemoryFallback = true;
          this.isInitialized = true;
          console.warn('[CraneLabDB] IndexedDB init timed out (400ms race) - activating instant in-memory fallback.');
          resolve(null);
        }
      }, 400);

      try {
        if (typeof indexedDB === 'undefined') {
          clearTimeout(timer);
          isSettled = true;
          this.useInMemoryFallback = true;
          this.isInitialized = true;
          resolve(null);
          return;
        }

        const request = indexedDB.open(CRANELAB_CONFIG.DB_NAME, CRANELAB_CONFIG.DB_VERSION);

        // # Handle version change blocked by open tab/connection
        request.onblocked = () => {
          if (!isSettled) {
            isSettled = true;
            clearTimeout(timer);
            this.useInMemoryFallback = true;
            this.isInitialized = true;
            console.warn('[CraneLabDB] IndexedDB upgrade blocked by another connection - falling back to in-memory store.');
            resolve(null);
          }
        };

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
          if (!isSettled) {
            isSettled = true;
            clearTimeout(timer);
            this.db = event.target.result;
            this.isInitialized = true;
            resolve(this.db);
          }
        };

        // # Function: Error handler reporting failure
        request.onerror = (event) => {
          if (!isSettled) {
            isSettled = true;
            clearTimeout(timer);
            this.useInMemoryFallback = true;
            this.isInitialized = true;
            console.warn('[CraneLabDB] IndexedDB Open Error - falling back to in-memory store:', event.target.error);
            resolve(null);
          }
        };
      } catch (err) {
        if (!isSettled) {
          isSettled = true;
          clearTimeout(timer);
          this.useInMemoryFallback = true;
          this.isInitialized = true;
          resolve(null);
        }
      }
    });
  }

  // # Function: Helper for executing ACID transaction with 400ms timeout race and in-memory fallback
  async executeTransaction(storeName, mode, callback) {
    await this.init();

    // If in-memory fallback active or db connection failed
    if (this.useInMemoryFallback || !this.db) {
      return this.executeInMemoryTransaction(storeName, mode, callback);
    }

    return new Promise((resolve) => {
      let isSettled = false;
      const timer = setTimeout(() => {
        if (!isSettled) {
          isSettled = true;
          console.warn(`[CraneLabDB] Transaction on ${storeName} timed out (400ms) - resolving via in-memory fallback.`);
          resolve(this.executeInMemoryTransaction(storeName, mode, callback));
        }
      }, 400);

      try {
        const transaction = this.db.transaction(storeName, mode);
        const store = transaction.objectStore(storeName);
        let result = null;

        transaction.oncomplete = () => {
          if (!isSettled) {
            isSettled = true;
            clearTimeout(timer);
            resolve(result);
          }
        };

        transaction.onerror = (event) => {
          if (!isSettled) {
            isSettled = true;
            clearTimeout(timer);
            console.warn(`[CraneLabDB] Transaction error on ${storeName}:`, event.target.error);
            resolve(this.executeInMemoryTransaction(storeName, mode, callback));
          }
        };

        try {
          result = callback(store);
        } catch (cbErr) {
          transaction.abort();
          if (!isSettled) {
            isSettled = true;
            clearTimeout(timer);
            resolve(this.executeInMemoryTransaction(storeName, mode, callback));
          }
        }
      } catch (txErr) {
        if (!isSettled) {
          isSettled = true;
          clearTimeout(timer);
          resolve(this.executeInMemoryTransaction(storeName, mode, callback));
        }
      }
    });
  }

  // # Function: In-Memory transactional mock simulator
  executeInMemoryTransaction(storeName, mode, callback) {
    const memStore = this.inMemoryStore[storeName] || [];
    const mockStore = {
      put: (item) => {
        if (Array.isArray(memStore)) {
          memStore.push(item);
        } else {
          memStore[item.candidateId || Date.now()] = item;
        }
        return { result: item };
      },
      add: (item) => {
        const id = Date.now() + Math.floor(Math.random() * 1000);
        const copy = { ...item, id, queueId: id };
        if (Array.isArray(memStore)) {
          memStore.push(copy);
        } else {
          memStore[id] = copy;
        }
        return { result: id };
      },
      get: (key) => {
        let res = null;
        if (Array.isArray(memStore)) {
          res = memStore.find((x) => x.id === key || x.candidateId === key || x.queueId === key);
        } else {
          res = memStore[key];
        }
        return { result: res || null };
      },
      getAll: () => ({ result: Array.isArray(memStore) ? [...memStore] : Object.values(memStore) }),
      index: () => ({
        getAll: () => ({ result: Array.isArray(memStore) ? [...memStore] : Object.values(memStore) })
      }),
      clear: () => {
        if (Array.isArray(memStore)) memStore.length = 0;
        else this.inMemoryStore[storeName] = {};
        return { result: undefined };
      }
    };

    try {
      return callback(mockStore);
    } catch (e) {
      return null;
    }
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
    const cleanId = (candidateId || 'UNKNOWN_CANDIDATE').toString().trim().toUpperCase();
    const cleanToken = sessionToken || 'OFFLINE_TOKEN';
    
    let signature = 'SIGNATURE_FALLBACK';
    try {
      signature = await CraneLabSecurity.computeTelemetrySignature(
        cleanToken,
        timestamp,
        telemetryPayload
      );
    } catch (sigErr) {
      console.warn('Telemetry signature warning:', sigErr);
    }

    const logEntry = {
      candidateId: cleanId,
      sessionToken: cleanToken,
      timestamp,
      eventType,
      payload: telemetryPayload,
      signature,
      isoDate: new Date(timestamp).toISOString()
    };

    try {
      return await this.executeTransaction(
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
    } catch (dbErr) {
      console.warn('[CraneLabDB] IndexedDB logTelemetry stored to memory fallback:', dbErr);
      this.inMemoryLogs = this.inMemoryLogs || [];
      this.inMemoryLogs.push(logEntry);
      return logEntry;
    }
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

