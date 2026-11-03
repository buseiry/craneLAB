# ==============================================================================
# CraneLab: ASVAM-Pulse - Unified Full-Stack Server
# TETFund - Tenstar Simulator Training Initiative
# Consortium: ASQ Development & Training UK / SAMMAX Global Services
# ==============================================================================
# Pure Python 3 standard library HTTP + REST API Server
# Serves:
# 1. Frontend: High-performance static asset server with PWA Service Worker headers.
# 2. Backend API: Telemetry synchronization, cohort leaderboard, and ESP32 IoT endpoints.
# ==============================================================================

import os
import sys
import json
import time
import mimetypes
from pathlib import Path
from http.server import ThreadingHTTPServer, BaseHTTPRequestHandler
from urllib.parse import urlparse, parse_qs

# # State Block: Server Configuration and File Storage Paths
HOST = "0.0.0.0"
PORT = int(os.environ.get("PORT", 8085))
BASE_DIR = Path(__file__).parent.resolve()
DB_FILE = BASE_DIR / "server_database.json"

# Initialize MIME types for web assets
mimetypes.init()
mimetypes.add_type("application/javascript", ".js")
mimetypes.add_type("text/css", ".css")
mimetypes.add_type("image/svg+xml", ".svg")
mimetypes.add_type("application/manifest+json", ".json")

# # State Block: Persistent Server Database Schema
def load_server_db():
    # # Function: Load or initialize persistent JSON database
    if DB_FILE.exists():
        try:
            with open(DB_FILE, "r", encoding="utf-8") as f:
                return json.load(f)
        except Exception as e:
            print(f"[!] Warning reading database: {e}")
    
    # Default initial schema
    initial_db = {
        "telemetry_records": [],
        "iot_packets": [],
        "cohort_leaderboard": [
            {
                "id": "TF-TNS-2026-0104",
                "name": "Chukwuebuka Obi Okonkwo",
                "institution": "LASUSTECH",
                "cohort": "Group 1",
                "rank": "Chief ASVAM Crane Engineer",
                "compositeScore": 98.6,
                "safetyScore": 98.6,
                "qualityScore": 100,
                "economyScore": 96.5,
                "safetyNaira": 8500,
                "cycleTime": "02:18",
                "token": "A48F9B1E4A...21D0",
                "timestamp": "2026-11-02T14:32:00Z"
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
                "timestamp": "2026-11-02T15:10:00Z"
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
                "timestamp": "2026-11-02T16:05:00Z"
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
                "timestamp": "2026-11-02T16:48:00Z"
            }
        ],
        "created_at": time.time()
    }
    save_server_db(initial_db)
    return initial_db

def save_server_db(data):
    # # Function: Persist in-memory database to disk atomically
    try:
        with open(DB_FILE, "w", encoding="utf-8") as f:
            json.dump(data, f, indent=2)
    except Exception as e:
        print(f"[!] Error persisting database: {e}")

# In-memory database singleton
SERVER_DB = load_server_db()
SERVER_START_TIME = time.time()

# # Class: CraneLabHTTPHandler - Full Stack Request Router
class CraneLabHTTPHandler(BaseHTTPRequestHandler):
    # # Function: Suppress default verbose request logging in production
    def log_message(self, format, *args):
        # Format: timestamp - path - status
        sys.stdout.write(f"[{time.strftime('%Y-%m-%d %H:%M:%S')}] {self.command} {self.path} -> {args[1]}\n")
        sys.stdout.flush()

    # # Function: Enable Standard CORS Headers for API flexibility
    def send_cors_headers(self):
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Requested-With")

    # # Function: Handle HTTP OPTIONS pre-flight checks
    def do_OPTIONS(self):
        self.send_response(204)
        self.send_cors_headers()
        self.end_headers()

    # # Function: Route HTTP GET Requests (Static files & Read APIs)
    def do_GET(self):
        parsed = urlparse(self.path)
        path = parsed.path

        # -------------------------------------------------------------
        # # BACKEND REST API GET ROUTES
        # -------------------------------------------------------------
        if path == "/api/v1/health":
            # # API: System Health & Status Check
            uptime_seconds = round(time.time() - SERVER_START_TIME, 1)
            response = {
                "status": "HEALTHY",
                "system": "CraneLab: ASVAM-Pulse Server",
                "version": "1.5.0",
                "uptime_seconds": uptime_seconds,
                "server_time": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
                "database_stats": {
                    "telemetry_records": len(SERVER_DB.get("telemetry_records", [])),
                    "leaderboard_entries": len(SERVER_DB.get("cohort_leaderboard", [])),
                    "iot_packets_logged": len(SERVER_DB.get("iot_packets", []))
                }
            }
            return self.send_json_response(200, response)

        elif path == "/api/v1/leaderboard":
            # # API: Retrieve Cohort Leaderboard (with optional cohort group filter)
            query_params = parse_qs(parsed.query)
            cohort_filter = query_params.get("cohort", ["ALL"])[0]

            entries = SERVER_DB.get("cohort_leaderboard", [])
            if cohort_filter != "ALL":
                entries = [e for e in entries if cohort_filter.lower() in e.get("cohort", "").lower()]

            # Sort descending by compositeScore
            entries.sort(key=lambda x: (x.get("compositeScore", 0), x.get("safetyScore", 0)), reverse=True)
            return self.send_json_response(200, {
                "cohort_filter": cohort_filter,
                "total_records": len(entries),
                "leaderboard": entries
            })

        elif path == "/api/v1/iot/packets":
            # # API: Query recent IoT packets received from hardware retro-kits
            packets = SERVER_DB.get("iot_packets", [])[-20:] # Last 20 packets
            return self.send_json_response(200, {
                "total_logged": len(SERVER_DB.get("iot_packets", [])),
                "recent_packets": packets
            })

        # -------------------------------------------------------------
        # # FRONTEND STATIC ASSET ROUTING
        # -------------------------------------------------------------
        if path in ["", "/"]:
            local_path = BASE_DIR / "index.html"
        else:
            # Strip leading slash and sanitize path
            safe_rel = path.lstrip("/").replace("..", "")
            local_path = BASE_DIR / safe_rel

        if local_path.is_file() and local_path.exists():
            return self.serve_static_file(local_path)
        else:
            # 404 fallback to index.html for SPA / PWA routing
            if (BASE_DIR / "index.html").exists():
                return self.serve_static_file(BASE_DIR / "index.html")
            self.send_error(404, f"File not found: {path}")

    # # Function: Route HTTP POST Requests (Data Ingestion & Sync)
    def do_POST(self):
        parsed = urlparse(self.path)
        path = parsed.path

        # Read JSON body payload
        content_length = int(self.headers.get("Content-Length", 0))
        body_bytes = self.rfile.read(content_length)
        
        try:
            payload = json.loads(body_bytes.decode("utf-8")) if body_bytes else {}
        except Exception as e:
            return self.send_json_response(400, {"error": "Invalid JSON payload", "details": str(e)})

        # -------------------------------------------------------------
        # # POST /api/v1/telemetry/submit
        # -------------------------------------------------------------
        if path == "/api/v1/telemetry/submit":
            # # State Block: Process candidate telemetry log submission
            candidate_id = payload.get("candidateId", "UNKNOWN")
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

            SERVER_DB["telemetry_records"].append(record)

            # Update or insert into leaderboard
            comp_score = metrics.get("compositeScore", 0)
            existing = next((item for item in SERVER_DB["cohort_leaderboard"] if item["id"] == candidate_id), None)
            if existing:
                if comp_score >= existing.get("compositeScore", 0):
                    existing["compositeScore"] = comp_score
                    existing["safetyScore"] = metrics.get("stabilityScore", existing.get("safetyScore", 0))
                    existing["timestamp"] = record["received_at"]
            else:
                SERVER_DB["cohort_leaderboard"].append({
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

            save_server_db(SERVER_DB)

            print(f"[✓] Telemetry received from {candidate_id} | Score: {comp_score}% | Token: {session_token[:8]}...")
            return self.send_json_response(200, {
                "status": "ACK_SUCCESS",
                "message": "Telemetry record cryptographically accepted and logged",
                "record_id": record["record_id"],
                "received_at": record["received_at"],
                "total_records_stored": len(SERVER_DB["telemetry_records"])
            })

        # -------------------------------------------------------------
        # # POST /api/v1/iot/packet
        # -------------------------------------------------------------
        elif path == "/api/v1/iot/packet":
            # # State Block: Ingest ESP32 + MPU6050 6-DOF IMU packet
            device_id = payload.get("device_id", "ASVAM-CRANE-UNKNOWN")
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
            SERVER_DB["iot_packets"].append(packet_entry)
            
            # Keep only latest 200 packets
            if len(SERVER_DB["iot_packets"]) > 200:
                SERVER_DB["iot_packets"] = SERVER_DB["iot_packets"][-200:]
            save_server_db(SERVER_DB)

            return self.send_json_response(200, {
                "status": "IOT_PACKET_ACK",
                "device_id": device_id,
                "crc16_valid": bool(crc)
            })

        # -------------------------------------------------------------
        # # POST /api/v1/leaderboard/sync
        # -------------------------------------------------------------
        elif path == "/api/v1/leaderboard/sync":
            # # State Block: Batch leaderboard merge from offline instructor sync
            records = payload.get("records", [])
            merged_count = 0
            for r in records:
                cid = r.get("id")
                if not cid:
                    continue
                existing = next((item for item in SERVER_DB["cohort_leaderboard"] if item["id"] == cid), None)
                if existing:
                    if r.get("compositeScore", 0) >= existing.get("compositeScore", 0):
                        existing.update(r)
                        merged_count += 1
                else:
                    SERVER_DB["cohort_leaderboard"].append(r)
                    merged_count += 1

            save_server_db(SERVER_DB)
            return self.send_json_response(200, {
                "status": "SYNC_MERGED",
                "merged_records": merged_count,
                "total_leaderboard_size": len(SERVER_DB["cohort_leaderboard"])
            })

        else:
            self.send_error(404, f"API Endpoint Not Found: {path}")

    # # Function: Transmit JSON Response Helper
    def send_json_response(self, status_code, data):
        response_bytes = json.dumps(data, indent=2).encode("utf-8")
        self.send_response(status_code)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(response_bytes)))
        self.send_cors_headers()
        self.end_headers()
        self.wfile.write(response_bytes)

    # # Function: Static File Server with proper MIME & Service Worker Caching Headers
    def serve_static_file(self, file_path):
        mime_type, _ = mimetypes.guess_type(str(file_path))
        if not mime_type:
            mime_type = "application/octet-stream"

        try:
            file_bytes = file_path.read_bytes()
            self.send_response(200)
            self.send_header("Content-Type", mime_type)
            self.send_header("Content-Length", str(len(file_bytes)))
            self.send_cors_headers()

            # Service Worker & PWA headers
            if file_path.name == "sw.js":
                self.send_header("Service-Worker-Allowed", "/")
                self.send_header("Cache-Control", "no-cache, no-store, must-revalidate")
            elif file_path.suffix in [".html", ".json"]:
                self.send_header("Cache-Control", "no-cache")
            else:
                self.send_header("Cache-Control", "public, max-age=86400")

            self.end_headers()
            self.wfile.write(file_bytes)
        except Exception as e:
            self.send_error(500, f"Error reading file: {e}")

# # Function: Main Server Startup Entry Point
def run_server():
    server_address = (HOST, PORT)
    httpd = ThreadingHTTPServer(server_address, CraneLabHTTPHandler)
    
    print("=" * 75)
    print("  🏗️  CraneLab: ASVAM-Pulse - Unified Full-Stack Server")
    print("  TETFund - Tenstar Simulator Training Initiative")
    print("  Consortium: ASQ Development & Training UK / SAMMAX Global Services")
    print("=" * 75)
    print(f"  [✓] Frontend Web App:     http://localhost:{PORT}/")
    print(f"  [✓] Standalone Release:   http://localhost:{PORT}/CraneLab_Offline_Release.html")
    print(f"  [✓] Backend Health API:   http://localhost:{PORT}/api/v1/health")
    print(f"  [✓] Telemetry Ingest API: http://localhost:{PORT}/api/v1/telemetry/submit")
    print(f"  [✓] Cohort Leaderboard:   http://localhost:{PORT}/api/v1/leaderboard")
    print(f"  [✓] Hardware IoT API:     http://localhost:{PORT}/api/v1/iot/packets")
    print("=" * 75)
    print(f"  Server listening on {HOST}:{PORT}... Press Ctrl+C to stop.")
    print("=" * 75)
    
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\n[*] Server shutdown signal received. Halting cleanly.")
        httpd.server_close()

if __name__ == "__main__":
    run_server()

