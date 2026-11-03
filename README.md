# 🏗️ CraneLab: ASVAM-Pulse

> **Advanced Simulation for Vocational Advancement & Modernisation (ASVAM)**  
> **TETFund - Tenstar Simulator Training Initiative**  
> *Consortium: ASQ Development & Training UK / SAMMAX Global Services*  
> *Lead Implementation Partner: Lagos State University of Science & Technology (LASUSTECH)*

---

## 📌 Executive Summary

**CraneLab: ASVAM-Pulse** is an offline-first Progressive Web App (PWA) and zero-dependency embedded training simulator engineered for Nigerian tertiary institutions (Polytechnics and Universities) under the TETFund Tenstar initiative. 

The application delivers an end-to-end industrial crane operator qualification platform—bridging digital classroom theory, physical plant defect inspection, dual-axis ISO joystick kinematics, and IoT hardware telemetry retro-kits.

---

## 🚀 Key Modules & Architecture

### Gate A: Candidate Authentication & Cryptographic Session Gate
* **Zero-Knowledge HMAC-SHA256 Token Generation**: Dynamic Web Crypto API hash `Hash(Candidate_ID + Cohort_Group + Timestamp + Secret_Salt)` preventing score tampering.
* **IndexedDB Enterprise Store (`CraneLabDB`)**: ACID-compliant local database storing `candidate_profile`, `workbook_answers`, `telemetry_logs`, and `sync_queue`.

### Gate B: ASVAM Pre-Start Inspection & Hazard Control
* **Workstation Ergonomics (Workbook 6.4)**: Interactive seat lumbar adjustment, 360° mirror/camera blind-spot alignment, and joystick neutral calibration.
* **Mandatory Site PPE Verification (Workbook 6.2)**: High-vis vest, steel-toe boots, hard hat, and rigging gloves selection.
* **Hierarchy of Controls Gate (Workbook 6.3 & 6.5)**: Matching overhead powerlines, waterlogged soil, and slew perimeter hazards to their statutory control measures.
* **Defect Isolation Interlock (Workbook 6.6 & Slide 11)**: 20% random defect spawn rate (frayed wire rope, hydraulic leaks). Candidates must isolate and tag out the fault to earn **+₦500 Safety Naira**; starting ignition with an active defect triggers an immediate **Critical Assessment Fail**.
* **Workbook Auto-Logger**: Persists student selections across Questions 6.1 through 6.14.

### Gate C: Dual-Joystick Simulator & Dynamics Engine
* **Strict ASVAM Joystick Mapping**:
  * **Left Joystick**: Slew Left/Right (Azimuth $\theta$) and Trolley In/Out (Radius $r$).
  * **Right Joystick (Z-Axis Only)**: Hoist Raise/Lower ($z$). Lateral axis physically locked to prevent inadvertent swing.
* **Split-Screen HTML5 Canvas**:
  * *Left Half*: $360^\circ$ Top-Down Slew Radar (Mast, rotating Jib, Trolley, Exclusion Zones, 3rd Floor Target Drop Zone).
  * *Right Half*: Side-Elevation Height Gauge ($0\text{ m}$ to $32\text{ m}$ mast, scaffolding obstacles, cable suspension).
* **Second-Order Damped Pendulum Sway ODE**:
  $$\frac{d^2\phi}{dt^2} + 2\zeta\omega_n\frac{d\phi}{dt} + \frac{g}{L}\sin\phi = -\frac{a_{\text{trolley/slew}}}{L}$$
* **Control Input Damping Oscilloscope**: Live jerk detection ($j = \frac{|\Delta u|}{\Delta t}$) visualizing smooth green vs. jerky red shock inputs.

### Career Gamification & Tenstar Scoring Pillars
* **"Abuja Crane Life" 4-Stage Career Progression**:
  1. Level 1: Yard Apprentice
  2. Level 2: Junior Riggers Mate
  3. Level 3: Senior Tower Operator
  4. Level 4: Chief ASVAM Crane Engineer
* **Live Tenstar Performance Pillars**:
  * **Quality Pillar (30%)**: Touchdown softness and target accuracy.
  * **Safety Pillar (50%)**: Pendulum sway damping ($< 5^\circ$ for Shift 2) and exclusion zone compliance.
  * **Economy Pillar (20%)**: Jerk reduction, direction hunting prevention, and cycle benchmark efficiency.
* **Virtual Safety Naira Formula**:
  $$\text{Payout}(\text{₦}) = \text{BasePay} \times \left(\frac{Q \times 0.30 + S \times 0.50 + E \times 0.20}{100}\right) + \text{Bonus}$$

### Embedded ESP32 + MPU6050 IoT Hardware Bridge
* Real-time $10\text{ Hz}$ JSON telemetry output formatted for microcontroller retro-kits:
```json
{
  "device_id": "ASVAM-CRANE-04",
  "protocol_version": "ASVAM-IoT-v1.4",
  "timestamp_ms": 1730626000000,
  "packet_seq": 42,
  "mpu6050": { "pitch_deg": 1.45, "roll_deg": -0.82, "sway_vector_magnitude": 1.67 },
  "load_cell": { "payload_kg": 3500.0, "swl_utilization_pct": 46.7 },
  "crc16_checksum": "0x776A"
}
```

### Gate D: 7-Step Safe Shutdown, Ready-to-Rig Pass & Offline Sync
* **Mandatory 7-Step Safe Shutdown Gate (Workbook 6.12 & Slide 87)**:
  1. Position jib/trolley in designated safe zone
  2. Stabilise & lower hook/attachment safely
  3. Neutralise joysticks & apply slewing brake
  4. Disengage operating systems & key switch
  5. Inspect cab gauges & anemometer
  6. Record shift telemetry in ASVAM logbook
  7. Safe cab egress via 3 points of contact
* **Shareable Operator License & Ready-To-Rig Pass**: $1200 \times 675$ Canvas PNG export displaying operator rank, performance radar bars, cryptographic HMAC signature, and `"CLEARED FOR TENSTAR PHYSICAL SIMULATOR"` badge.
* **Offline WhatsApp Sync**: Students export `ASVAM-SYNC:<BASE64>` score strings into the cohort WhatsApp group; the instructor pastes them into the app to merge the leaderboard offline.
* **Standalone Single-File Bundler (`bundle_single_file.py`)**: Merges all HTML, CSS, SVG, and JS modules into a $301\text{ KB}$ zero-dependency file (`CraneLab_Offline_Release.html`) executable by double-clicking.

---

## 💻 Quick Start & Deployment

### Run Locally (Offline PWA)
1. Open `index.html` in any modern web browser (Google Chrome, Microsoft Edge, Mozilla Firefox, Safari).
2. The service worker (`sw.js`) automatically pre-caches all assets for airplane-mode execution.

### Build Single-File Standalone Release
```bash
python bundle_single_file.py
```
Outputs `CraneLab_Offline_Release.html` which can be shared via WhatsApp, USB flash drive, or Bluetooth mesh without requiring any local server or web host.

---

## 👥 Contributors & Consortium

* **Principal Developer & Architect**: `buseiry` (Lagos State University of Science and Technology - LASUSTECH)
* **Collaborator**: `CARLEELTECH0`
* **Initiative**: TETFund - Tenstar Simulator Training Initiative (ASQ UK / SAMMAX Global Services)

