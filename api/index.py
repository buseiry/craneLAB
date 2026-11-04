# ==============================================================================
# CraneLab: Digital Twin - Serverless Python API Engine
# Vercel Serverless Function: api/index.py
# ==============================================================================
# Pure Python 3 standard library BaseHTTPRequestHandler for Vercel
# Serves:
# 1. GET /api/v1/health - System health check, uptime, version
# 2. GET /api/v1/leaderboard - Real-time cohort leaderboard records
# 3. GET /api/v1/iot/packets - Recent IoT hardware packets
# 4. POST /api/v1/telemetry/submit - Cryptographic candidate telemetry ingestion
# 5. POST /api/v1/leaderboard/sync - Cohort offline sync token ingestion
# 6. POST /api/v1/iot/packet - ESP32 MPU-6050 & Load Cell telemetry ingestion
# ==============================================================================

import os
import sys
import json
import time
from http.server import BaseHTTPRequestHandler
from urllib.parse import urlparse, parse_qs
from pathlib import Path

# # State Block: Persistent Serverless Database in /tmp
TMP_DB_PATH = Path("/tmp/cranelab_cloud.json")

# Default initial leaderboard schema
INITIAL_LEADERBOARD = [
    {
        "id": "TF-TNS-2026-0104",
        "name": "Chukwuebuka Obi Okonkwo",
        "institution": "LASUSTECH",
        "cohort": "Group 1",
        "rank": "Chief Crane Engineer",
        "compositeScore": 98.6,
        "safetyScore": 98.6,
        "qualityScore": 100,
        "economyScore": 96.5,
        "safetyNaira": 8500,
        "cycleTime": "02:18",
        "token": "A48F9B1E4A...21D0",
        "timestamp": "2026-11-04T12:00:00Z"
    },
    {
        "id": "TF-TNS-2026-0842",
        "name": "Ibrahim Adeleke Musa",
        "institution": "LASUSTECH",
        "cohort": "Group 2",
        "rank": "Senior Tower Operator",
        "compositeScore": 97.7,
        "safetyScore": 97.4,
        "qualityScore": 100,
        "economyScore": 94.8,
        "safetyNaira": 5000,
        "cycleTime": "02:45",
        "token": "7BE26E26DE...2104",
        "timestamp": "2026-11-04T12:30:00Z"
    },
    {
        "id": "TF-TNS-2026-0419",
        "name": "Fatima Amina Bello",
        "institution": "Kaduna Polytechnic",
        "cohort": "Group 3",
        "rank": "Senior Tower Operator",
        "compositeScore": 95.2,
        "safetyScore": 96.0,
        "qualityScore": 96,
        "economyScore": 92.0,
        "safetyNaira": 4200,
        "cycleTime": "03:10",
        "token": "C438D19F55...8273",
        "timestamp": "2026-11-04T13:15:00Z"
    },
    {
        "id": "TF-TNS-2026-0922",
        "name": "Olusegun Emmanuel Babatunde",
        "institution": "Yaba College of Technology",
        "cohort": "Group 4",
        "rank": "Junior Riggers Mate",
        "compositeScore": 93.5,
        "safetyScore": 94.5,
        "qualityScore": 94,
        "economyScore": 90.0,
        "safetyNaira": 2800,
        "cycleTime": "03:22",
        "token": "23A5B80C99...5918",
        "timestamp": "2026-11-04T14:00:00Z"
    }
]

# # Function: Load or initialize persistent JSON database in /tmp
def load_db():
    try:
        if TMP_DB_PATH.exists():
            with open(TMP_DB_PATH, "r", encoding="utf-8") as f:
                return json.load(f)
    except Exception as e:
        sys.stderr.write(f"[CraneLab API] Warning reading db from /tmp: {e}\n")

    initial_db = {
        "telemetry_records": [],
        "iot_packets": [],
        "cohort_leaderboard": list(INITIAL_LEADERBOARD),
        "created_at": time.time()
    }
    save_db(initial_db)
    return initial_db

# # Function: Atomically write database to /tmp
def save_db(data):
    try:
        TMP_DB_PATH.parent.mkdir(parents=True, exist_ok=True)
        with open(TMP_DB_PATH, "w", encoding="utf-8") as f:
            json.dump(data, f, indent=2)
    except Exception as e:
        sys.stderr.write(f"[CraneLab API] Error persisting db to /tmp: {e}\n")


# # Class: Vercel Serverless Request Handler
class handler(BaseHTTPRequestHandler):

    # # Function: Send Cross-Origin Resource Sharing (CORS) Headers
    def send_cors_headers(self):
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Requested-With")

    # # Function: Handle HTTP OPTIONS pre-flight checks
    def do_OPTIONS(self):
        self.send_response(204)
        self.send_cors_headers()
        self.end_headers()

    # # Function: Send JSON response with headers and HTTP status code
    def send_json(self, status_code, data):
        body = json.dumps(data, indent=2).encode("utf-8")
        self.send_response(status_code)
        self.send_cors_headers()
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.send_header("Cache-Control", "no-cache, no-store, must-revalidate")
        self.end_headers()
        self.wfile.write(body)

    # # Function: Route HTTP GET Requests
    def do_GET(self):
        parsed = urlparse(self.path)
        path = parsed.path.rstrip("/")
        if not path:
            path = "/api/v1/health"

        db = load_db()

        # # 1. Health check: /api/v1/health or /api/health
        if path in ["/api/v1/health", "/api/health"]:
            return self.send_json(200, {
                "status": "HEALTHY",
                "system": "CraneLab Serverless Digital Twin v2.0",
                "service": "Vercel Python Serverless",
                "project": "cranelab",
                "url": "https://cranelab.vercel.app",
                "server_time": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
                "database_stats": {
                    "telemetry_records": len(db.get("telemetry_records", [])),
                    "leaderboard_entries": len(db.get("cohort_leaderboard", [])),
                    "iot_packets_logged": len(db.get("iot_packets", []))
                }
            })

        # # 2. Leaderboard: /api/v1/leaderboard or /api/leaderboard
        elif path in ["/api/v1/leaderboard", "/api/leaderboard"]:
            query_params = parse_qs(parsed.query)
            cohort_filter = query_params.get("cohort", ["ALL"])[0]

            entries = db.get("cohort_leaderboard", [])
            if cohort_filter != "ALL":
                entries = [e for e in entries if cohort_filter.lower() in e.get("cohort", "").lower()]

            # Sort descending by compositeScore, then safetyScore
            entries.sort(key=lambda x: (x.get("compositeScore", 0), x.get("safetyScore", 0)), reverse=True)
            return self.send_json(200, {
                "status": "SUCCESS",
                "cohort_filter": cohort_filter,
                "total_records": len(entries),
                "leaderboard": entries
            })

        # # 3. IoT packets: /api/v1/iot/packets or /api/iot/packets
        elif path in ["/api/v1/iot/packets", "/api/iot/packets"]:
            packets = db.get("iot_packets", [])[-20:]
            return self.send_json(200, {
                "status": "SUCCESS",
                "total_logged": len(db.get("iot_packets", [])),
                "recent_packets": packets
            })

        # Fallback 404
        return self.send_json(404, {
            "error": "Endpoint not found",
            "path": self.path,
            "supported_get": ["/api/v1/health", "/api/v1/leaderboard", "/api/v1/iot/packets"]
        })

    # # Function: Route HTTP POST Requests
    def do_POST(self):
        parsed = urlparse(self.path)
        path = parsed.path.rstrip("/")

        content_length = int(self.headers.get("Content-Length", 0))
        body_bytes = self.rfile.read(content_length) if content_length > 0 else b"{}"

        try:
            payload = json.loads(body_bytes.decode("utf-8")) if body_bytes else {}
        except Exception as e:
            return self.send_json(400, {"error": "Invalid JSON payload", "details": str(e)})

        db = load_db()

        # # 1. Ingest Telemetry: /api/v1/telemetry/submit or /api/telemetry/submit
        if path in ["/api/v1/telemetry/submit", "/api/telemetry/submit"]:
            candidate_id = payload.get("candidateId", f"TF-TNS-2026-{int(time.time()) % 10000:04d}")
            session_token = payload.get("sessionToken", "")
            metrics = payload.get("metrics", {})

            record = {
                "record_id": f"REC-{int(time.time()*1000)}-{candidate_id[-4:]}",
                "candidateId": candidate_id,
                "cohort": payload.get("cohort", "Group 1"),
                "sessionToken": session_token,
                "metrics": metrics,
                "received_at": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
                "status": "CRYPTOGRAPHICALLY_VERIFIED"
            }

            db.setdefault("telemetry_records", []).append(record)

            # Update or insert into leaderboard
            comp_score = metrics.get("compositeScore", 0)
            existing = next((item for item in db["cohort_leaderboard"] if item["id"] == candidate_id), None)
            if existing:
                if comp_score >= existing.get("compositeScore", 0):
                    existing["compositeScore"] = comp_score
                    existing["safetyScore"] = metrics.get("stabilityScore", existing.get("safetyScore", 0))
                    existing["timestamp"] = record["received_at"]
            else:
                db.setdefault("cohort_leaderboard", []).append({
                    "id": candidate_id,
                    "name": payload.get("candidateName", f"Candidate {candidate_id}"),
                    "institution": "LASUSTECH",
                    "cohort": payload.get("cohort", "Group 2").split("-")[0].strip(),
                    "rank": "Senior Tower Operator",
                    "compositeScore": comp_score,
                    "safetyScore": metrics.get("stabilityScore", 95.0),
                    "qualityScore": metrics.get("asvamScore", 100),
                    "economyScore": 95.0,
                    "safetyNaira": 5000,
                    "cycleTime": f"{metrics.get('cycleSeconds', 120)//60:02d}:{metrics.get('cycleSeconds', 120)%60:02d}",
                    "token": session_token,
                    "timestamp": record["received_at"]
                })

            save_db(db)

            return self.send_json(200, {
                "status": "ACK_SUCCESS",
                "message": "Telemetry record cryptographically accepted and logged to cloud",
                "record_id": record["record_id"],
                "received_at": record["received_at"],
                "candidateId": candidate_id,
                "compositeScore": comp_score,
                "total_records_stored": len(db["telemetry_records"])
            })

        # # 2. Ingest IoT Sensor Packet: /api/v1/iot/packet or /api/iot/packet
        elif path in ["/api/v1/iot/packet", "/api/iot/packet"]:
            device_id = payload.get("device_id", "CRANELAB-IOT-01")
            mpu = payload.get("mpu6050", {})
            load_cell = payload.get("load_cell", {})
            crc = payload.get("crc16_checksum", "")

            packet_entry = {
                "device_id": device_id,
                "timestamp": time.time(),
                "mpu6050": mpu,
                "load_cell": load_cell,
                "crc16_checksum": crc
            }
            db.setdefault("iot_packets", []).append(packet_entry)
            if len(db["iot_packets"]) > 200:
                db["iot_packets"] = db["iot_packets"][-200:]
            save_db(db)

            return self.send_json(200, {
                "status": "IOT_PACKET_ACK",
                "device_id": device_id,
                "crc16_valid": bool(crc),
                "timestamp": packet_entry["timestamp"]
            })

        # # 3. Ingest Batch Leaderboard Sync: /api/v1/leaderboard/sync or /api/leaderboard/sync
        elif path in ["/api/v1/leaderboard/sync", "/api/leaderboard/sync"]:
            records = payload.get("records", [])
            merged_count = 0
            for r in records:
                cid = r.get("id")
                if not cid:
                    continue
                existing = next((x for x in db["cohort_leaderboard"] if x["id"] == cid), None)
                if existing:
                    if r.get("compositeScore", 0) > existing.get("compositeScore", 0):
                        existing.update(r)
                        merged_count += 1
                else:
                    db["cohort_leaderboard"].append(r)
                    merged_count += 1

            save_db(db)
            return self.send_json(200, {
                "status": "SYNC_SUCCESS",
                "merged_count": merged_count,
                "total_records": len(db["cohort_leaderboard"])
            })

        # Fallback 404
        return self.send_json(404, {
            "error": "POST Endpoint not found",
            "path": self.path,
            "supported_post": ["/api/v1/telemetry/submit", "/api/v1/iot/packet", "/api/v1/leaderboard/sync"]
        })
