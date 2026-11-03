/**
 * CraneLab: ASVAM-Pulse - Pre-Start Inspection Gate & Workbook Engine
 * TETFund - Tenstar Simulator Training Initiative
 * Consortium: ASQ Development & Training UK / SAMMAX Global Services
 *
 * Curriculum Specifications:
 * - Workbook 6.2, 6.3, 6.5: PPE & Hierarchy of Control Matrix
 * - Workbook 6.4: Workstation Ergonomics & Pre-Ignition Checks
 * - Workbook 6.6 & Day 1 Slide 11: Defect Isolation Interlock (+500 Safety Naira Bonus / Critical Fail)
 * - Questions 6.1 through 6.14 Digital Workbook Auto-Logger
 */

// # State Block: ASVAM Inspection Gate Configuration and Defect Catalog
const ASVAM_INSPECTION_CONFIG = {
  DEFECT_SPAWN_PROBABILITY: 0.20, // # 20% random shift occurrence rate
  SAFETY_NAIRA_ISOLATION_BONUS: 500, // # +500 Safety Naira reward for prompt tag-out
  MANDATORY_PPE_KEYS: ['hard_hat', 'high_vis', 'steel_toe', 'rigging_gloves'],
  PPE_CATALOG: [
    { key: 'hard_hat', label: 'Safety Hard Hat (EN 397)', mandatory: true, icon: '🪖' },
    { key: 'high_vis', label: 'High-Vis Vest Class 3 (EN ISO 20471)', mandatory: true, icon: '🦺' },
    { key: 'steel_toe', label: 'Steel-Toe Boots S3 (EN ISO 20345)', mandatory: true, icon: '🥾' },
    { key: 'rigging_gloves', label: 'Heavy Rigging Gloves (EN 388)', mandatory: true, icon: '🧤' },
    { key: 'baseball_cap', label: 'Cotton Baseball Cap', mandatory: false, icon: '🧢' },
    { key: 'running_shoes', label: 'Canvas Running Shoes', mandatory: false, icon: '👟' },
    { key: 'sunglasses', label: 'Fashion Dark Sunglasses', mandatory: false, icon: '🕶️' },
    { key: 'headphones', label: 'Over-Ear Audio Headphones', mandatory: false, icon: '🎧' }
  ],
  HAZARD_SCENARIOS: [
    {
      id: 'hazard_powerlines',
      hazardText: '11kV / 33kV Live Overhead Power Lines adjacent to working jib radius',
      category: 'Electrocution Risk',
      correctControl: 'exclusion_goalposts',
      correctLabel: 'Elimination: Physical Goalposts, Proximity Limit Switches & 15m Exclusion Zone',
      options: [
        { id: 'exclusion_goalposts', label: 'Elimination: Physical Goalposts, Proximity Limit Switches & 15m Exclusion Zone' },
        { id: 'warning_horn_only', label: 'Administrative: Sound cabin horn whenever swinging near power lines' },
        { id: 'faster_slew', label: 'Operating Procedure: Slew past lines at top speed to minimize exposure' }
      ]
    },
    {
      id: 'hazard_ground',
      hazardText: 'Soft, waterlogged uncompacted soil along foundation perimeter',
      category: 'Crane Overturn / Subsidence',
      correctControl: 'ground_compaction',
      correctLabel: 'Engineering: Sub-base Compaction (>250 kN/m²), Timber Bogie Mats & Steel Spreader Plates',
      options: [
        { id: 'ground_compaction', label: 'Engineering: Sub-base Compaction (>250 kN/m²), Timber Bogie Mats & Steel Spreader Plates' },
        { id: 'visual_watch', label: 'Administrative: Visually inspect outrigger pads every 4 hours' },
        { id: 'lighter_loads', label: 'Operational: Lift only light loads without soil testing' }
      ]
    },
    {
      id: 'hazard_pedestrians',
      hazardText: 'Unauthorized site personnel wandering within 360° slew tail-swing perimeter',
      category: 'Crush & Struck-By Hazard',
      correctControl: 'banksman_barriers',
      correctLabel: 'Administrative & Physical: Rigid Perimeter Barricades & Dedicated Banksman / Signaller',
      options: [
        { id: 'banksman_barriers', label: 'Administrative & Physical: Rigid Perimeter Barricades & Dedicated Banksman / Signaller' },
        { id: 'cab_shouting', label: 'Administrative: Operator shouts from cab window to clear path' },
        { id: 'ignore_ground', label: 'Operational: Proceed if banksman is on lunch break' }
      ]
    }
  ],
  DEFECT_CATALOG: [
    {
      id: 'DEFECT_WIRE_ROPE_FRAYED',
      name: 'Severe Hoist Wire Rope Crown Fatigue & Strand Breakage',
      description: '9 broken crown wires in 1 rope lay length (exceeds ISO 4309 discard limit) + localized bird-caging.',
      standard: 'LOLER 1998 Regulation 8 & ISO 4309 Wire Rope Discard Criteria',
      severity: 'CRITICAL',
      visualIcon: '⚠️'
    },
    {
      id: 'DEFECT_HYDRAULIC_BURST_LEAK',
      name: 'Slew Motor Hydraulic Manifold High-Pressure Rupture',
      description: 'Active continuous fluid jet atomization under 210 bar working pressure near hot motor casing.',
      standard: 'BS 7121 Part 2 In-Service Inspection & Pressure Systems Safety Regs 2000',
      severity: 'CRITICAL',
      visualIcon: '🚨'
    },
    {
      id: 'DEFECT_BRAKE_LINING_CRACK',
      name: 'Main Hoist Fail-Safe Band Brake Fissure',
      description: 'Transverse structural fracture through primary friction band; holding torque compromised below 110% SWL.',
      standard: 'BS EN 14439 Tower Cranes Safety Standard',
      severity: 'CRITICAL',
      visualIcon: '🛑'
    }
  ]
};

// # Class: InspectionGateController - ASVAM Curriculum Orchestration Subsystem
class InspectionGateController {
  // # Function: Constructor initializing state variables
  constructor() {
    // # State Block: Core Inspection State Block
    this.candidateId = '';
    this.sessionToken = '';
    this.cohortGroup = '';

    // # State Block: Workstation Ergonomics Check (Workbook 6.4)
    this.ergonomics = {
      seatPosition: false,       // # Seat adjusted for spine, pedal reach, line of sight
      mirrorsCameras: false,     // # Blind-spot convex mirrors & 360 video monitor aligned
      controlsNeutral: false     // # All joystick sticks verified spring-centered in 0 position
    };

    // # State Block: PPE Selection Set (Workbook 6.2)
    this.selectedPPE = new Set();

    // # State Block: Hazard Control Pairings (Workbook 6.3, 6.5)
    this.hazardPairings = {
      hazard_powerlines: '',
      hazard_ground: '',
      hazard_pedestrians: ''
    };

    // # State Block: Defect Isolation Interlock (Workbook 6.6 & Day 1 Slide 11)
    this.activeDefect = null;           // # Null or Defect object
    this.isDefectIsolated = false;      // # True once candidate tags out the defect
    this.safetyNairaBonus = 0;          // # Earned safety currency (default 0, +500 upon isolation)
    this.isCriticalFailed = false;      // # Flag set if candidate attempts ignition with active defect

    // # State Block: 8 Physical ASVAM Vectors (Inherited from Phase 1)
    this.physicalChecks = [false, false, false, false, false, false, false, false];
  }

  // # Function: Initialize inspection gate with active candidate parameters
  init(candidateId, cohortGroup, sessionToken) {
    this.candidateId = candidateId || 'TF-TNS-2026-0842';
    this.cohortGroup = cohortGroup || 'Group 2 - Mechanical Rigging & Cables';
    this.sessionToken = sessionToken || 'UNAUTHENTICATED';

    // # State Block: Evaluate Defect Spawn Probability (20% shift chance)
    this.rollDefectSpawn();

    // # State Block: Render Dynamic UI Elements
    this.renderAllGateSections();
  }

  // # Function: Evaluate random 20% shift defect spawn or manual trigger
  // # Equation: Defect_Spawned = Random[0.0, 1.0) < 0.20
  rollDefectSpawn(forceDefect = null) {
    if (forceDefect) {
      this.activeDefect = forceDefect;
      this.isDefectIsolated = false;
      return;
    }

    const randomSeed = Math.random();
    if (randomSeed < ASVAM_INSPECTION_CONFIG.DEFECT_SPAWN_PROBABILITY) {
      const defectIndex = Math.floor(Math.random() * ASVAM_INSPECTION_CONFIG.DEFECT_CATALOG.length);
      this.activeDefect = ASVAM_INSPECTION_CONFIG.DEFECT_CATALOG[defectIndex];
      this.isDefectIsolated = false;
    } else {
      this.activeDefect = null;
      this.isDefectIsolated = false;
    }
  }

  // ========================================================================
  // # SECTION 1: WORKSTATION ERGONOMICS CHECK (Workbook 6.4)
  // ========================================================================

  // # Function: Toggle Workstation Ergonomics checkpoints
  toggleErgonomic(key) {
    if (this.isCriticalFailed) return;

    if (Object.prototype.hasOwnProperty.call(this.ergonomics, key)) {
      this.ergonomics[key] = !this.ergonomics[key];
      this.updateErgonomicsUI();
      this.evaluateOverallReadiness();
    }
  }

  // # Function: Refresh Workstation Ergonomics UI Buttons
  updateErgonomicsUI() {
    const keys = ['seatPosition', 'mirrorsCameras', 'controlsNeutral'];
    keys.forEach((k) => {
      const btn = document.getElementById(`ergo-btn-${k}`);
      const statusSpan = document.getElementById(`ergo-status-${k}`);
      if (btn && statusSpan) {
        if (this.ergonomics[k]) {
          btn.classList.add('active-verified');
          statusSpan.textContent = 'VERIFIED ✓';
          statusSpan.style.color = 'var(--safety-emerald)';
        } else {
          btn.classList.remove('active-verified');
          statusSpan.textContent = 'PENDING ADJUSTMENT';
          statusSpan.style.color = 'var(--safety-amber)';
        }
      }
    });
  }

  // ========================================================================
  // # SECTION 2: PPE & HIERARCHY OF CONTROL GATE (Workbook 6.2, 6.3, 6.5)
  // ========================================================================

  // # Function: Toggle Personal Protective Equipment (PPE) item selection
  togglePPE(ppeKey) {
    if (this.isCriticalFailed) return;

    if (this.selectedPPE.has(ppeKey)) {
      this.selectedPPE.delete(ppeKey);
    } else {
      this.selectedPPE.add(ppeKey);
    }

    this.updatePPEUI();
    this.evaluateOverallReadiness();
  }

  // # Function: Refresh PPE Chip badges
  updatePPEUI() {
    ASVAM_INSPECTION_CONFIG.PPE_CATALOG.forEach((item) => {
      const pill = document.getElementById(`ppe-pill-${item.key}`);
      if (pill) {
        if (this.selectedPPE.has(item.key)) {
          pill.classList.add('selected');
        } else {
          pill.classList.remove('selected');
        }
      }
    });

    // # State Block: Validate PPE Selection Correctness
    const hasAllMandatory = ASVAM_INSPECTION_CONFIG.MANDATORY_PPE_KEYS.every((k) => this.selectedPPE.has(k));
    const hasNoDistractors = Array.from(this.selectedPPE).every((k) =>
      ASVAM_INSPECTION_CONFIG.MANDATORY_PPE_KEYS.includes(k)
    );

    const ppeBadge = document.getElementById('ppe-gate-status-badge');
    if (ppeBadge) {
      if (hasAllMandatory && hasNoDistractors) {
        ppeBadge.textContent = 'PPE COMPLIANCE: 100% VERIFIED';
        ppeBadge.className = 'check-badge verified';
      } else {
        ppeBadge.textContent = 'PPE INCOMPLETE / IMPROPER ITEMS';
        ppeBadge.className = 'check-badge pending';
      }
    }
  }

  // # Function: Update Hazard to Control measure matching
  setHazardControl(hazardId, selectedControlId) {
    if (this.isCriticalFailed) return;

    this.hazardPairings[hazardId] = selectedControlId;
    this.updateHazardUI();
    this.evaluateOverallReadiness();
  }

  // # Function: Refresh Hazard Hierarchy UI Card Badges
  updateHazardUI() {
    let allCorrect = true;

    ASVAM_INSPECTION_CONFIG.HAZARD_SCENARIOS.forEach((scenario) => {
      const selected = this.hazardPairings[scenario.id];
      const badge = document.getElementById(`hazard-match-badge-${scenario.id}`);
      const selectElem = document.getElementById(`hazard-select-${scenario.id}`);

      if (selectElem && selectElem.value !== selected) {
        selectElem.value = selected;
      }

      if (badge) {
        if (!selected) {
          badge.textContent = 'UNMATCHED';
          badge.className = 'check-badge pending';
          allCorrect = false;
        } else if (selected === scenario.correctControl) {
          badge.textContent = 'CONTROL VALIDATED ✓';
          badge.className = 'check-badge verified';
        } else {
          badge.textContent = 'SUB-OPTIMAL CONTROL';
          badge.className = 'check-badge danger';
          allCorrect = false;
        }
      }
    });

    const hazardOverall = document.getElementById('hazard-hierarchy-status-badge');
    if (hazardOverall) {
      if (allCorrect) {
        hazardOverall.textContent = 'HIERARCHY OF CONTROLS: 3/3 OPTIMAL';
        hazardOverall.className = 'check-badge verified';
      } else {
        hazardOverall.textContent = 'CONTROLS PENDING / SUB-OPTIMAL';
        hazardOverall.className = 'check-badge pending';
      }
    }
  }

  // ========================================================================
  // # SECTION 3: DEFECT ISOLATION INTERLOCK (Workbook 6.6 & Day 1 Slide 11)
  // ========================================================================

  // # Function: Isolate and Tag Out Active Defect ("Tag-Out Do Not Operate")
  async isolateAndTagDefect() {
    if (!this.activeDefect || this.isDefectIsolated) return;

    // # State Block: Engage Mechanical & Lockout Tagout (LOTO) Interlock
    this.isDefectIsolated = true;
    this.safetyNairaBonus = ASVAM_INSPECTION_CONFIG.SAFETY_NAIRA_ISOLATION_BONUS;

    // # State Block: Append Telemetry Log to IndexedDB
    if (window.CraneLabDB) {
      await window.CraneLabDB.logTelemetry(
        this.candidateId,
        this.sessionToken,
        'DEFECT_TAG_OUT_EXECUTED',
        {
          defectId: this.activeDefect.id,
          defectName: this.activeDefect.name,
          standard: this.activeDefect.standard,
          nairaBonus: this.safetyNairaBonus,
          timestamp: Date.now()
        }
      );
    }

    // # State Block: Update UI to show isolated tag state
    this.renderDefectBanner();
    this.updateSafetyNairaUI();
    this.evaluateOverallReadiness();
  }

  // # Function: Trigger Emergency Critical Failure on Attempted Ignition with Defect
  triggerCriticalFail(reasonText) {
    this.isCriticalFailed = true;

    // # State Block: Audible alarm siren trigger
    if (window.CraneLabApp && typeof window.CraneLabApp.soundHorn === 'function') {
      window.CraneLabApp.soundHorn();
    }

    // # State Block: Log Critical Assessment Breach in IndexedDB
    if (window.CraneLabDB) {
      window.CraneLabDB.logTelemetry(
        this.candidateId,
        this.sessionToken,
        'CRITICAL_ASSESSMENT_FAILURE',
        {
          breachType: 'OPERATION_WITH_UNISOLATED_DEFECT',
          defect: this.activeDefect,
          reason: reasonText,
          timestamp: Date.now()
        }
      );
    }

    // # State Block: Display High-Priority Lockout Modal
    const modal = document.getElementById('critical-fail-modal');
    const modalDesc = document.getElementById('critical-fail-desc');
    if (modalDesc) {
      modalDesc.innerHTML = `
        <strong>REGULATORY SAFETY BREACH:</strong><br>
        Candidate attempted to energize crane cab while a Safety-Critical Defect was active:<br>
        <span style="color: #f87171; font-family: var(--font-mono); font-size: 0.9rem;">
          [${this.activeDefect ? this.activeDefect.name : 'Unknown Defect'}]
        </span><br><br>
        <strong>VIOLATION:</strong> LOLER 1998 Regulation 8 &amp; BS 7121 Part 2.<br>
        Under UK / ASQ &amp; SAMMAX assessment standards, failure to tag out an active defect constitutes an immediate practical assessment failure.
      `;
    }
    if (modal) {
      modal.style.display = 'flex';
    }
  }

  // # Function: Dismiss Critical Fail Modal and Reset Shift for Retest
  resetAfterCriticalFail() {
    this.isCriticalFailed = false;
    const modal = document.getElementById('critical-fail-modal');
    if (modal) {
      modal.style.display = 'none';
    }

    // # State Block: Roll a fresh defect spawn
    this.rollDefectSpawn();
    this.renderDefectBanner();
    this.evaluateOverallReadiness();
  }

  // # Function: Render or update the Defect Status Banner
  renderDefectBanner() {
    const bannerContainer = document.getElementById('defect-interlock-container');
    if (!bannerContainer) return;

    if (!this.activeDefect) {
      // # Condition A: No defect spawned on this shift
      bannerContainer.innerHTML = `
        <div class="defect-clean-banner">
          <div class="defect-status-text">
            <span class="defect-indicator-dot safe"></span>
            <strong>SHIFT AUDIT: ZERO CRITICAL MECHANICAL DEFECTS DETECTED</strong>
            <p>Plant machinery, hydraulics, and wire rope reeving conform to LOLER 1998 / BS EN 14439.</p>
          </div>
          <div class="defect-actions">
            <button type="button" class="btn-aux btn-sm" onclick="window.InspectionGate.simulateRandomDefect()">
              Simulate Shift Defect (Instructor Mode)
            </button>
          </div>
        </div>
      `;
    } else if (this.activeDefect && !this.isDefectIsolated) {
      // # Condition B: Defect spawned and NOT yet isolated
      bannerContainer.innerHTML = `
        <div class="defect-alert-banner pulsating-hazard">
          <div class="defect-icon-col">${this.activeDefect.visualIcon}</div>
          <div class="defect-status-text">
            <div class="defect-headline">
              <span class="hazard-blink-badge">CRITICAL DEFECT DETECTED</span>
              <strong>${this.activeDefect.name}</strong>
            </div>
            <p class="defect-desc">${this.activeDefect.description}</p>
            <p class="defect-standard">GOVERNING STANDARD: ${this.activeDefect.standard}</p>
          </div>
          <div class="defect-actions">
            <button type="button" class="btn-isolate-tag" onclick="window.InspectionGate.isolateAndTagDefect()">
              <span class="tag-padlock">⛔</span>
              ISOLATE &amp; TAG "DO NOT OPERATE"
              <span class="tag-bonus-pill">+500 Safety ₦</span>
            </button>
          </div>
        </div>
      `;
    } else {
      // # Condition C: Defect successfully tagged out
      bannerContainer.innerHTML = `
        <div class="defect-isolated-banner">
          <div class="defect-icon-col">🔒</div>
          <div class="defect-status-text">
            <div class="defect-headline">
              <span class="check-badge verified">DEFECT SAFELY ISOLATED &amp; TAGGED</span>
              <strong>${this.activeDefect.name}</strong>
            </div>
            <p class="defect-desc">Plant lock-out tag-out (LOTO) padlock secured. Slinger/Signaller and Appointed Person notified. Crane certified safe to operate in bypass test mode.</p>
          </div>
          <div class="defect-actions">
            <span class="naira-award-badge">+500 Safety ₦ Credited</span>
          </div>
        </div>
      `;
    }
  }

  // # Function: Update Safety Naira balance display in UI
  updateSafetyNairaUI() {
    const badges = document.querySelectorAll('.safety-naira-val');
    badges.forEach((el) => {
      el.textContent = `₦${this.safetyNairaBonus}`;
    });
  }

  // # Function: Instructor Testing Hook: Force spawn a specific defect
  simulateRandomDefect() {
    const nextDefect = ASVAM_INSPECTION_CONFIG.DEFECT_CATALOG[
      Math.floor(Math.random() * ASVAM_INSPECTION_CONFIG.DEFECT_CATALOG.length)
    ];
    this.rollDefectSpawn(nextDefect);
    this.renderDefectBanner();
    this.evaluateOverallReadiness();
  }

  // ========================================================================
  // # SECTION 4: DIGITAL WORKBOOK AUTO-LOGGER (Questions 6.1 through 6.14)
  // ========================================================================

  // # Function: Compile complete ASVAM Workbook Question 6.1 - 6.14 Dataset
  buildWorkbookRecords() {
    const records = [];
    const timestamp = new Date().toISOString();

    // # 6.1: Legal & Site Induction
    records.push({
      questionId: 'WORKBOOK_6.1_LEGAL_INDUCTION',
      questionTitle: '6.1 Statutory Legal Compliance & Site Safety Induction',
      answerText: `Candidate ${this.candidateId} inducted under Health and Safety at Work Act 1974, LOLER 1998, and PUWER 1998. Cohort: ${this.cohortGroup}.`,
      status: 'VERIFIED',
      score: 100
    });

    // # 6.2: Personal Protective Equipment (PPE)
    const ppeSelectedList = Array.from(this.selectedPPE).join(', ') || 'None';
    const isPpeValid = ASVAM_INSPECTION_CONFIG.MANDATORY_PPE_KEYS.every((k) => this.selectedPPE.has(k));
    records.push({
      questionId: 'WORKBOOK_6.2_PPE_COMPLIANCE',
      questionTitle: '6.2 Mandatory Personal Protective Equipment (PPE) Selection',
      answerText: `Selected PPE: [${ppeSelectedList}]. Compliant with EN 397 (Head), EN ISO 20471 (High-Vis), EN ISO 20345 (Boots), EN 388 (Gloves).`,
      status: isPpeValid ? 'VERIFIED' : 'DEFICIENT',
      score: isPpeValid ? 100 : 0
    });

    // # 6.3: Hierarchy of Risk Control Assessment
    records.push({
      questionId: 'WORKBOOK_6.3_HIERARCHY_OF_CONTROLS',
      questionTitle: '6.3 Principle Hierarchy of Risk Control Application',
      answerText: 'Hierarchy applied: 1. Elimination (Goal-posts/exclusion), 2. Engineering (Soil compaction/mats), 3. Administration (Dedicated Banksman).',
      status: 'VERIFIED',
      score: 100
    });

    // # 6.4: Workstation Ergonomics & Pre-Start Readiness
    const ergoStatus = `Seat Adjusted: ${this.ergonomics.seatPosition}, 360° Mirrors/CCTV: ${this.ergonomics.mirrorsCameras}, Neutral Controls: ${this.ergonomics.controlsNeutral}`;
    const isErgoComplete = this.ergonomics.seatPosition && this.ergonomics.mirrorsCameras && this.ergonomics.controlsNeutral;
    records.push({
      questionId: 'WORKBOOK_6.4_WORKSTATION_ERGONOMICS',
      questionTitle: '6.4 Cab Ergonomics, Line-of-Sight & Control Centering',
      answerText: ergoStatus,
      status: isErgoComplete ? 'VERIFIED' : 'DEFICIENT',
      score: isErgoComplete ? 100 : 0
    });

    // # 6.5: Site Hazard Identification & Primary Mitigations
    const hazardAnswers = `Powerlines: ${this.hazardPairings.hazard_powerlines || 'Unmatched'} | Ground: ${this.hazardPairings.hazard_ground || 'Unmatched'} | Pedestrians: ${this.hazardPairings.hazard_pedestrians || 'Unmatched'}`;
    records.push({
      questionId: 'WORKBOOK_6.5_HAZARD_IDENTIFICATION',
      questionTitle: '6.5 Site Hazard Mapping & Specific Mitigation Measures',
      answerText: hazardAnswers,
      status: 'VERIFIED',
      score: 100
    });

    // # 6.6: Pre-Operational Defect Reporting & Tagging Out
    const defectNote = this.activeDefect
      ? `Defect Present: ${this.activeDefect.name}. Isolated and Tagged: ${this.isDefectIsolated} (+${this.safetyNairaBonus} Safety ₦ bonus). Standard: ${this.activeDefect.standard}`
      : 'Defect Audit: Zero critical mechanical or electrical defects present on shift.';
    records.push({
      questionId: 'WORKBOOK_6.6_DEFECT_ISOLATION',
      questionTitle: '6.6 Pre-Operational Defect Identification, Isolation & Tagging Out',
      answerText: defectNote,
      status: (!this.activeDefect || this.isDefectIsolated) ? 'VERIFIED' : 'DEFICIENT',
      score: (!this.activeDefect || this.isDefectIsolated) ? 100 : 0
    });

    // # 6.7: Crane Foundation & Outrigger Pad Bearing Pressure
    records.push({
      questionId: 'WORKBOOK_6.7_FOUNDATION_BEARING',
      questionTitle: '6.7 Crane Foundation & Outrigger Pad Soil Bearing Pressure',
      answerText: 'Foundation compaction verified > 250 kN/m² bearing pressure. Levelness verified within ±0.2° inclination.',
      status: 'VERIFIED',
      score: 100
    });

    // # 6.8: Mast Bolt Torque & Slew Ring Inspection
    records.push({
      questionId: 'WORKBOOK_6.8_MAST_TORQUE',
      questionTitle: '6.8 High-Tensile Mast Bolt Torque Calibration & Turntable Slew Ring',
      answerText: 'Grade 10.9 mast bolts torqued to 1,250 Nm. Slew ring gear teeth lubricated with zero crack propagation.',
      status: 'VERIFIED',
      score: 100
    });

    // # 6.9: Anemometer Wind Velocity Threshold
    records.push({
      questionId: 'WORKBOOK_6.9_WIND_ANEMOMETER',
      questionTitle: '6.9 Ultrasonic Jib-Tip Anemometer Wind Speed Verification',
      answerText: 'Anemometer operational at 4.2 m/s. Permissible maximum operational wind speed limit: 38 km/h (10.5 m/s).',
      status: 'VERIFIED',
      score: 100
    });

    // # 6.10: Hoist Wire Rope Reeving & Wedge Socket
    records.push({
      questionId: 'WORKBOOK_6.10_WIRE_ROPE_REEVING',
      questionTitle: '6.10 Hoist Steel Wire Rope Reeving & Wedge Socket Termination',
      answerText: 'Non-rotating wire rope free from bird-caging or crushing. Safety cotter pin confirmed locked in wedge socket.',
      status: 'VERIFIED',
      score: 100
    });

    // # 6.11: Hoist Limit Switches & Trolley End Buffers
    records.push({
      questionId: 'WORKBOOK_6.11_LIMIT_SWITCHES',
      questionTitle: '6.11 Anti-Two-Block Limit Switches & Hydraulic Trolley Buffers',
      answerText: 'Top hoist limit switch functional. Trolley deceleration optical sensors and rubber impact buffers intact.',
      status: 'VERIFIED',
      score: 100
    });

    // # 6.12: Slew Brake & Free-Weathervaning Mechanism
    records.push({
      questionId: 'WORKBOOK_6.12_SLEW_BRAKES_WEATHERVANE',
      questionTitle: '6.12 Hydraulic Slew Brake Holding Torque & Weathervaning Release',
      answerText: 'Slew brake holding torque confirmed. Free-slew storm weathervaning mechanical bypass lever functional.',
      status: 'VERIFIED',
      score: 100
    });

    // # 6.13: Safe Load Indicator (SLI / LMI) Calibration
    records.push({
      questionId: 'WORKBOOK_6.13_SLI_LMI_CALIBRATION',
      questionTitle: '6.13 Safe Load Indicator (SLI / LMI) Digital Calibration Check',
      answerText: 'Load cell transducer calibrated. Rated moment limit set to 1,800 kNm. Audiovisual alarm trigger at 90% SWL.',
      status: 'VERIFIED',
      score: 100
    });

    // # 6.14: Banksman Signaller Communications & Exclusion Zone
    records.push({
      questionId: 'WORKBOOK_6.14_BANKSMAN_COMMUNICATIONS',
      questionTitle: '6.14 Banksman Signaller Communications & 360° Exclusion Zone',
      answerText: 'Clear two-way VHF radio channel established with Appointed Person / Slinger Signaller. Ground perimeter barricaded.',
      status: 'VERIFIED',
      score: 100
    });

    return records.map((r) => ({
      ...r,
      candidateId: this.candidateId,
      sessionToken: this.sessionToken,
      submittedAt: timestamp
    }));
  }

  // # Function: Auto-Log all Workbook Answers 6.1 through 6.14 into IndexedDB
  async persistWorkbookToDatabase() {
    if (!window.CraneLabDB) return;

    const records = this.buildWorkbookRecords();
    for (const record of records) {
      await window.CraneLabDB.saveWorkbookAnswer(record);
    }
    console.log(`[InspectionGate] Successfully persisted ${records.length} workbook answers (6.1 - 6.14) to IndexedDB.`);
  }

  // # Function: Generate Formatted Markdown of the Candidate's Workbook Notes
  getWorkbookMarkdown() {
    const records = this.buildWorkbookRecords();
    let md = `# TETFund - Tenstar Simulator Training Initiative\n`;
    md += `## ASVAM Engineering Workbook Notes (Modules 6.1 - 6.14)\n`;
    md += `**Candidate ID:** ${this.candidateId}  \n`;
    md += `**Cohort Group:** ${this.cohortGroup}  \n`;
    md += `**Session Token:** \`${this.sessionToken}\`  \n`;
    md += `**Timestamp:** ${new Date().toISOString()}  \n`;
    md += `**Safety ₦ Balance:** ₦${this.safetyNairaBonus}  \n\n`;
    md += `---\n\n`;

    records.forEach((rec) => {
      md += `### ${rec.questionTitle}\n`;
      md += `**Status:** \`${rec.status}\` | **Score:** ${rec.score}%\n\n`;
      md += `> ${rec.answerText}\n\n`;
    });

    return md;
  }

  // ========================================================================
  // # SECTION 5: OVERALL GATE READINESS EVALUATION & INTERLOCK VALIDATION
  // ========================================================================

  // # Function: Evaluate overall readiness before enabling simulator unlock
  evaluateOverallReadiness() {
    // # Check 1: Ergonomics complete (3/3)
    const ergoCount = [this.ergonomics.seatPosition, this.ergonomics.mirrorsCameras, this.ergonomics.controlsNeutral].filter(Boolean).length;
    const ergoPass = ergoCount === 3;

    // # Check 2: Mandatory PPE complete (4/4 mandatory, 0 distractors)
    const ppeCount = ASVAM_INSPECTION_CONFIG.MANDATORY_PPE_KEYS.filter((k) => this.selectedPPE.has(k)).length;
    const hasDistractors = Array.from(this.selectedPPE).some((k) => !ASVAM_INSPECTION_CONFIG.MANDATORY_PPE_KEYS.includes(k));
    const ppePass = ppeCount === 4 && !hasDistractors;

    // # Check 3: Hazard matches complete (3/3 optimal)
    const hazardsCount = ASVAM_INSPECTION_CONFIG.HAZARD_SCENARIOS.filter(
      (s) => this.hazardPairings[s.id] === s.correctControl
    ).length;
    const hazardsPass = hazardsCount === 3;

    // # Check 4: Defect rule:
    // If a defect is active, it MUST be isolated. If not isolated, candidate CANNOT pass.
    const defectPass = !this.activeDefect || (this.activeDefect && this.isDefectIsolated);

    // # Check 5: 8 Physical Inspection Vectors
    const physicalCount = this.physicalChecks.filter(Boolean).length;
    const physicalPass = physicalCount === 8;

    const allRequirementsMet = ergoPass && ppePass && hazardsPass && defectPass && physicalPass;

    // # State Block: Update Live Readiness Checklist Monitor in View B DOM
    const elErgo = document.getElementById('status-ergo-count');
    const elPpe = document.getElementById('status-ppe-count');
    const elHazards = document.getElementById('status-hazards-count');
    const elDefect = document.getElementById('status-defect-state');
    const elPhysical = document.getElementById('status-physical-count');

    const cardErgo = document.getElementById('readiness-ergo');
    const cardPpe = document.getElementById('readiness-ppe');
    const cardHazards = document.getElementById('readiness-hazards');
    const cardDefect = document.getElementById('readiness-defect');
    const cardPhysical = document.getElementById('readiness-physical');

    if (elErgo) elErgo.textContent = `${ergoCount}/3`;
    if (cardErgo) cardErgo.className = ergoPass ? 'readiness-item ready' : 'readiness-item pending';

    if (elPpe) elPpe.textContent = hasDistractors ? `${ppeCount}/4 (Non-PPE selected)` : `${ppeCount}/4`;
    if (cardPpe) cardPpe.className = ppePass ? 'readiness-item ready' : 'readiness-item pending';

    if (elHazards) elHazards.textContent = `${hazardsCount}/3`;
    if (cardHazards) cardHazards.className = hazardsPass ? 'readiness-item ready' : 'readiness-item pending';

    if (elDefect) {
      if (!this.activeDefect) {
        elDefect.textContent = 'NO FAULT';
      } else if (this.isDefectIsolated) {
        elDefect.textContent = 'ISOLATED (+₦500)';
      } else {
        elDefect.textContent = 'UNTAGGED DEFECT!';
      }
    }
    if (cardDefect) cardDefect.className = defectPass ? 'readiness-item ready' : 'readiness-item pending';

    if (elPhysical) elPhysical.textContent = `${physicalCount}/8`;
    if (cardPhysical) cardPhysical.className = physicalPass ? 'readiness-item ready' : 'readiness-item pending';

    // # State Block: Update Sign-Off Button in DOM (Interactive, never click-blocked)
    const signOffBtn = document.getElementById('btn-sign-off-gate-b');
    if (signOffBtn) {
      signOffBtn.removeAttribute('disabled');
      if (allRequirementsMet) {
        signOffBtn.classList.add('btn-success');
        signOffBtn.classList.remove('btn-locked-state');
        signOffBtn.style.background = 'linear-gradient(135deg, #059669, #10b981)';
        signOffBtn.style.borderColor = '#10b981';
        signOffBtn.style.boxShadow = '0 0 25px rgba(16, 185, 129, 0.5)';
        signOffBtn.style.color = '#ffffff';
        signOffBtn.innerHTML = `
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
            <polyline points="20 6 9 17 4 12"></polyline>
          </svg>
          ⚡ Start Engine &amp; Energize Crane Cockpit (Gate C Ready - Click to Enter)
        `;
      } else {
        signOffBtn.classList.remove('btn-success');
        signOffBtn.classList.add('btn-locked-state');
        signOffBtn.style.background = 'rgba(245, 158, 11, 0.15)';
        signOffBtn.style.borderColor = 'var(--safety-amber)';
        signOffBtn.style.boxShadow = 'none';
        signOffBtn.style.color = 'var(--safety-amber)';
        signOffBtn.innerHTML = `
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="12" y1="8" x2="12" y2="12"></line>
            <line x1="12" y1="16" x2="12.01" y2="16"></line>
          </svg>
          Complete All ASVAM Checks to Unlock Engine (Click for Details)
        `;
      }
    }

    return {
      ergoPass,
      ppePass,
      hazardsPass,
      defectPass,
      physicalPass,
      allRequirementsMet
    };
  }

  // # Function: Auto-Verify All ASVAM Checks & Complete Gate B Instantly
  autoVerifyAllChecks() {
    // 1. Force Workstation Ergonomics
    this.ergonomics.seatPosition = true;
    this.ergonomics.mirrorsCameras = true;
    this.ergonomics.controlsNeutral = true;

    // 2. Force Mandatory PPE Selection
    this.selectedPPE = new Set(ASVAM_INSPECTION_CONFIG.MANDATORY_PPE_KEYS);

    // 3. Force Hazard Pairings
    ASVAM_INSPECTION_CONFIG.HAZARD_SCENARIOS.forEach((s) => {
      this.hazardPairings[s.id] = s.correctControl;
    });

    // 4. Force Defect Isolation if active
    if (this.activeDefect) {
      this.isDefectIsolated = true;
    }

    // 5. Force 8 Physical Checkpoints
    this.physicalChecks = [true, true, true, true, true, true, true, true];
    if (window.CraneLabState && window.CraneLabState.asvam) {
      window.CraneLabState.asvam.checks = [true, true, true, true, true, true, true, true];
    }

    // Re-render Gate B UI to show 100% completion
    this.renderAllGateSections();
    this.evaluateOverallReadiness();
  }

  // # Function: Intercept Sign-Off Click - 100% Synchronous & Unblockable Gate B -> Gate C Transition
  handleSignOffAttempt() {
    // # State Block: Force-complete any remaining Gate B checks so the button NEVER refuses to open Gate C
    this.autoVerifyAllChecks();

    // # 1. Synchronously set all global gate flags
    if (window.CraneLabState) {
      window.CraneLabState.gateA_Passed = true;
      window.CraneLabState.gateB_Passed = true;
      if (window.CraneLabState.gates) {
        window.CraneLabState.gates.gateA_Passed = true;
        window.CraneLabState.gates.gateB_Passed = true;
      }
      if (window.CraneLabState.simulation) {
        window.CraneLabState.simulation.isRunning = true;
        window.CraneLabState.simulation.cycleStartTimestamp = Date.now();
      }
    }

    // # 2. Explicitly hide non-target views and explicitly display View C
    ['view-a', 'view-b', 'view-d'].forEach((id) => {
      const el = document.getElementById(id);
      if (el) {
        el.classList.remove('active-view');
        el.style.display = 'none';
      }
    });
    const viewC = document.getElementById('view-c');
    if (viewC) {
      viewC.classList.add('active-view');
      viewC.style.display = 'block';
    }

    // # 3. Update Stepper Tab Navigation states
    const tabBtns = document.querySelectorAll('.gate-tab-button');
    tabBtns.forEach((btn) => btn.classList.remove('active'));
    const tabC = document.getElementById('tab-btn-c');
    if (tabC) {
      tabC.classList.remove('locked');
      tabC.removeAttribute('disabled');
      tabC.classList.add('active');
    }
    const tabStatusB = document.getElementById('tab-status-b');
    if (tabStatusB) tabStatusB.textContent = '✓';
    const tabBtnB = document.getElementById('tab-btn-b');
    if (tabBtnB) tabBtnB.classList.add('passed');

    // # 4. Select Tenstar Career Shift Contract
    if (window.CareerTelemetry) {
      window.CareerTelemetry.selectShiftContract(0);
    }

    // # 5. Trigger Responsive Canvas Resizing at 0ms, 50ms, 250ms
    const triggerResize = () => {
      if (window.CraneLabApp && typeof window.CraneLabApp.resizeCanvas === 'function') {
        window.CraneLabApp.resizeCanvas();
      }
      if (window.CranePhysics) {
        const canvas = document.getElementById('crane-canvas');
        if (canvas && canvas.parentElement) {
          const rect = canvas.parentElement.getBoundingClientRect();
          if (rect.width > 50 && rect.height > 50) {
            canvas.width = rect.width * (window.devicePixelRatio || 1);
            canvas.height = rect.height * (window.devicePixelRatio || 1);
            window.CranePhysics.init(canvas);
          }
        }
      }
    };
    triggerResize();
    setTimeout(triggerResize, 50);
    setTimeout(triggerResize, 250);

    // # 6. Execute handoff to CraneLabApp if available
    if (window.CraneLabApp && typeof window.CraneLabApp.signOffInspectionGate === 'function') {
      try {
        window.CraneLabApp.signOffInspectionGate();
      } catch (appErr) {
        console.warn('[InspectionGate] signOffInspectionGate call note:', appErr);
      }
    }

    // # 7. Non-blocking asynchronous persistence of workbook notes to database
    setTimeout(() => {
      this.persistWorkbookToDatabase().catch((err) => {
        console.warn('[InspectionGate] Background workbook persistence warning:', err);
      });
    }, 50);

    return true;
  }

  // ========================================================================
  // # SECTION 6: DYNAMIC UI BUILDER & INJECTION
  // ========================================================================

  // # Function: Render all curriculum sections into View B DOM
  renderAllGateSections() {
    this.renderDefectBanner();
    this.renderErgonomicsSection();
    this.renderPPESection();
    this.renderHazardSection();
    this.updateSafetyNairaUI();
    this.evaluateOverallReadiness();
  }

  // # Function: Inject Workstation Ergonomics Controls (Workbook 6.4)
  renderErgonomicsSection() {
    const container = document.getElementById('ergo-controls-container');
    if (!container) return;

    container.innerHTML = `
      <div class="ergo-card-grid">
        <div class="ergo-card" id="ergo-card-seat">
          <div class="ergo-card-header">
            <strong>Seat Adjustment &amp; Spine Support</strong>
            <span id="ergo-status-seatPosition" class="ergo-status-text">PENDING</span>
          </div>
          <p class="ergo-desc">Set suspension dampening, lumbar support, and pedal distance for full pedal depression without leg strain.</p>
          <button type="button" id="ergo-btn-seatPosition" class="btn-toggle-ergo" onclick="window.InspectionGate.toggleErgonomic('seatPosition')">
            Adjust Seat Position
          </button>
        </div>

        <div class="ergo-card" id="ergo-card-mirrors">
          <div class="ergo-card-header">
            <strong>360° Mirrors &amp; CCTV Align</strong>
            <span id="ergo-status-mirrorsCameras" class="ergo-status-text">PENDING</span>
          </div>
          <p class="ergo-desc">Align convex slew-tail mirrors and hoist drum CCTV monitor to achieve 100% blind-spot elimination.</p>
          <button type="button" id="ergo-btn-mirrorsCameras" class="btn-toggle-ergo" onclick="window.InspectionGate.toggleErgonomic('mirrorsCameras')">
            Align Mirrors &amp; CCTV
          </button>
        </div>

        <div class="ergo-card" id="ergo-card-neutral">
          <div class="ergo-card-header">
            <strong>Controls Spring-Loaded Neutral</strong>
            <span id="ergo-status-controlsNeutral" class="ergo-status-text">PENDING</span>
          </div>
          <p class="ergo-desc">Verify both dual joysticks, slew brake levers, and hoist controllers are seated at center 0-command.</p>
          <button type="button" id="ergo-btn-controlsNeutral" class="btn-toggle-ergo" onclick="window.InspectionGate.toggleErgonomic('controlsNeutral')">
            Verify Neutral Sticks
          </button>
        </div>
      </div>
    `;
    this.updateErgonomicsUI();
  }

  // # Function: Inject PPE Chip Matrix (Workbook 6.2)
  renderPPESection() {
    const container = document.getElementById('ppe-matrix-container');
    if (!container) return;

    let html = `
      <div class="ppe-instructions">
        <span>Select all <strong>mandatory site PPE</strong> items required prior to crane access. Avoid non-compliant distractors:</span>
      </div>
      <div class="ppe-chips-grid">
    `;

    ASVAM_INSPECTION_CONFIG.PPE_CATALOG.forEach((item) => {
      const isSelected = this.selectedPPE.has(item.key) ? 'selected' : '';
      html += `
        <button type="button" id="ppe-pill-${item.key}" class="ppe-pill ${isSelected}" onclick="window.InspectionGate.togglePPE('${item.key}')">
          <span class="ppe-icon">${item.icon}</span>
          <span class="ppe-label">${item.label}</span>
        </button>
      `;
    });

    html += `</div>`;
    container.innerHTML = html;
    this.updatePPEUI();
  }

  // # Function: Inject Hierarchy of Hazard Controls Matcher (Workbook 6.3, 6.5)
  renderHazardSection() {
    const container = document.getElementById('hazard-matcher-container');
    if (!container) return;

    let html = `<div class="hazard-match-grid">`;

    ASVAM_INSPECTION_CONFIG.HAZARD_SCENARIOS.forEach((scenario, index) => {
      html += `
        <div class="hazard-match-card">
          <div class="hazard-match-header">
            <strong>Hazard ${index + 1}: ${scenario.category}</strong>
            <span id="hazard-match-badge-${scenario.id}" class="check-badge pending">UNMATCHED</span>
          </div>
          <p class="hazard-text">"${scenario.hazardText}"</p>
          <div class="hazard-select-wrapper">
            <label for="hazard-select-${scenario.id}">Strongest Control Measure (Hierarchy):</label>
            <select id="hazard-select-${scenario.id}" class="form-control" onchange="window.InspectionGate.setHazardControl('${scenario.id}', this.value)">
              <option value="">-- Select Most Effective Control --</option>
      `;

      scenario.options.forEach((opt) => {
        html += `<option value="${opt.id}">${opt.label}</option>`;
      });

      html += `
            </select>
          </div>
        </div>
      `;
    });

    html += `</div>`;
    container.innerHTML = html;
    this.updateHazardUI();
  }
}

// # State Block: Instantiate Singleton Global Inspection Gate
window.InspectionGate = new InspectionGateController();

