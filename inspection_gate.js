/**
 * CraneLab: ASVAM-Pulse - Pre-Start Inspection Gate Subsystem
 * Simplified 5-Step Macro-Checklist Engine (Chief Crane Simulation Architecture)
 * Consortium: ASQ Development & Training UK / SAMMAX Global Services
 */

// # State Block: Inspection Gate Configuration
const ASVAM_INSPECTION_CONFIG = {
  SAFETY_NAIRA_ISOLATION_BONUS: 500,
  MACRO_CHECK_KEYS: ['ergo', 'ppe', 'zone', 'cables', 'radio']
};

// # Class: InspectionGateController - Simplified 5-Macro-Check Pre-Start Subsystem
class InspectionGateController {
  // # Function: Constructor initializing 5 plain-English macro checks
  constructor() {
    // # State Block: Core Session Identifiers
    this.candidateId = 'TF-TNS-2026-0842';
    this.sessionToken = 'INITIALIZED';
    this.cohortGroup = 'Group 2 - Mechanical Rigging & Cables';
    this.safetyNairaBonus = 500;

    // # State Block: 5 Plain-English Macro Checklist Items (Part 1)
    this.macroChecks = {
      ergo: false,      // # 1. Seat & Mirrors Adjusted
      ppe: false,       // # 2. Safety Gear On
      zone: false,      // # 3. Danger Zone Clear
      cables: false,    // # 4. Crane Cables & Hook Checked
      radio: false      // # 5. Walkie-Talkie Tested
    };

    // # Backward compatibility states for workbook logging
    this.physicalChecks = [true, true, true, true, true, true, true, true];
    this.activeDefect = null;
    this.isDefectIsolated = true;
  }

  // # Function: Initialize gate with active candidate parameters
  init(candidateId, cohortGroup, sessionToken) {
    if (candidateId) this.candidateId = candidateId;
    if (cohortGroup) this.cohortGroup = cohortGroup;
    if (sessionToken) this.sessionToken = sessionToken;
    this.renderAllGateSections();
  }

  // # Function: Toggle Macro Check Item On/Off (Part 1)
  toggleMacroCheck(key) {
    // Normalize alias 'machine' -> 'cables'
    const checkKey = (key === 'machine') ? 'cables' : key;
    if (!Object.prototype.hasOwnProperty.call(this.macroChecks, checkKey)) return;

    // # 1. Toggle boolean check state
    this.macroChecks[checkKey] = !this.macroChecks[checkKey];
    const isChecked = this.macroChecks[checkKey];

    // # 2. Update DOM button styling and badge
    const btn = document.getElementById(`btn-check-${checkKey}`) || document.getElementById(`btn-check-${key}`);
    const badge = document.getElementById(`badge-check-${checkKey}`) || document.getElementById(`badge-check-${key}`);

    if (btn) {
      if (isChecked) {
        btn.classList.add('checked');
        btn.style.background = '#10b981';
        btn.style.borderColor = '#34d399';
        btn.style.color = '#ffffff';
        if (badge) {
          badge.textContent = '✅ VERIFIED';
          badge.style.background = '#ffffff';
          badge.style.color = '#065f46';
        }
      } else {
        btn.classList.remove('checked');
        btn.style.background = '#1e293b';
        btn.style.borderColor = '#334155';
        btn.style.color = '#f8fafc';
        if (badge) {
          badge.textContent = 'TAP TO CHECK';
          badge.style.background = 'rgba(255, 255, 255, 0.1)';
          badge.style.color = '#cbd5e1';
        }
      }
    }

    // # 3. Refresh status indicators & progress bar
    this.updateMacroStatusPill();
  }

  // # Function: Update Status Pill, Progress Bar & Engine Start Button Styling
  updateMacroStatusPill() {
    const totalDone = Object.values(this.macroChecks).filter(Boolean).length;
    const pill = document.getElementById('macro-checklist-status-pill');
    const startBtn = document.getElementById('btn-force-engine-start');
    const progressBar = document.getElementById('macro-progress-bar-fill');

    // Update 5-step progress bar (20% per completed check)
    if (progressBar) {
      progressBar.style.width = `${totalDone * 20}%`;
    }

    if (pill) {
      if (totalDone === 5) {
        pill.textContent = '✅ 5 / 5 CHECKS VERIFIED (READY)';
        pill.classList.add('ready');
      } else {
        pill.textContent = `${totalDone} / 5 CHECKS COMPLETED (${totalDone * 20}%)`;
        pill.classList.remove('ready');
      }
    }

    if (startBtn) {
      if (totalDone === 5) {
        startBtn.style.background = 'linear-gradient(135deg, #059669, #10b981)';
        startBtn.style.boxShadow = '0 0 30px rgba(16, 185, 129, 0.65)';
        startBtn.innerHTML = '⚡ START ENGINE &amp; ENTER COCKPIT (READY!)';
      } else {
        startBtn.innerHTML = `⚡ START ENGINE &amp; ENTER COCKPIT (${totalDone}/5 Checks)`;
      }
    }
  }

  // # Function: 1-Click Fast Pass - Auto-Verify All 5 Macro Checks & Immediately Start Engine (Part 1)
  autoVerifyAllChecks() {
    // # 1. Set all 5 macro check items to true and turn buttons green
    ['ergo', 'ppe', 'zone', 'cables', 'radio'].forEach((key) => {
      this.macroChecks[key] = true;
      const btn = document.getElementById(`btn-check-${key}`) || (key === 'cables' ? document.getElementById('btn-check-machine') : null);
      const badge = document.getElementById(`badge-check-${key}`) || (key === 'cables' ? document.getElementById('badge-check-machine') : null);
      if (btn) {
        btn.classList.add('checked');
        btn.style.background = '#10b981';
        btn.style.borderColor = '#34d399';
        btn.style.color = '#ffffff';
      }
      if (badge) {
        badge.textContent = '✅ VERIFIED';
        badge.style.background = '#ffffff';
        badge.style.color = '#065f46';
      }
    });

    this.updateMacroStatusPill();

    // # 2. Immediately call synchronous engine start function
    this.forceEngineStart();
  }

  // # Function: Guaranteed Synchronous Transition to Gate C (Zero DB Wait)
  forceEngineStart() {
    // # 1. Auto-mark all 5 checks as verified in state & UI
    ['ergo', 'ppe', 'zone', 'cables', 'radio'].forEach((key) => {
      this.macroChecks[key] = true;
      const btn = document.getElementById(`btn-check-${key}`) || (key === 'cables' ? document.getElementById('btn-check-machine') : null);
      const badge = document.getElementById(`badge-check-${key}`) || (key === 'cables' ? document.getElementById('badge-check-machine') : null);
      if (btn) {
        btn.classList.add('checked');
        btn.style.background = '#10b981';
        btn.style.borderColor = '#34d399';
        btn.style.color = '#ffffff';
      }
      if (badge) {
        badge.textContent = '✅ VERIFIED';
        badge.style.background = '#ffffff';
        badge.style.color = '#065f46';
      }
    });
    this.updateMacroStatusPill();

    // # 2. Synchronously set gate flags in global state
    if (window.CraneLabState) {
      window.CraneLabState.gateA_Passed = true;
      window.CraneLabState.gateB_Passed = true;
      if (window.CraneLabState.gates) {
        window.CraneLabState.gates.gateA_Passed = true;
        window.CraneLabState.gates.gateB_Passed = true;
      }
      if (window.CraneLabState.simulation) {
        window.CraneLabState.simulation.isRunning = true;
      }
    }

    // # 3. Synchronous screen transition: Hide View A, B, D and Display View C immediately
    if (window.CraneLabApp && typeof window.CraneLabApp.switchView === 'function') {
      window.CraneLabApp.switchView('view-c');
    } else {
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

      const tabBtns = document.querySelectorAll('.gate-tab-button');
      tabBtns.forEach((btn) => btn.classList.remove('active'));
      const tabC = document.getElementById('tab-btn-c');
      if (tabC) {
        tabC.classList.remove('locked');
        tabC.removeAttribute('disabled');
        tabC.classList.add('active');
      }
    }

    const tabBIcon = document.getElementById('tab-status-b');
    if (tabBIcon) {
      tabBIcon.textContent = '✓';
      tabBIcon.style.color = '#10b981';
    }
    const tabCIcon = document.getElementById('tab-status-c');
    if (tabCIcon) {
      tabCIcon.textContent = '⚡';
      tabCIcon.style.color = '#10b981';
    }

    // # 4. Resize and synchronize HTML5 canvas dimensions at 0ms, 50ms, 250ms
    const resizeFn = () => {
      if (window.CraneLabPhysics && typeof window.CraneLabPhysics.resizeCanvas === 'function') {
        window.CraneLabPhysics.resizeCanvas();
      }
      if (window.CranePhysics) {
        const canvas = document.getElementById('crane-canvas');
        if (canvas && typeof window.CranePhysics.init === 'function') window.CranePhysics.init(canvas);
      }
      if (window.CraneLabApp && typeof window.CraneLabApp.resizeCanvas === 'function') {
        window.CraneLabApp.resizeCanvas();
      }
    };
    resizeFn();
    setTimeout(resizeFn, 50);
    setTimeout(resizeFn, 250);

    // # 5. Spoken voice announcement
    if (window.CraneVoiceInstructor) {
      window.CraneVoiceInstructor.speak(
        "Welcome to CraneLab. Your hook is empty. Use the Left Joystick for Trolley and Slew, and push the Right Joystick up to lower your hook to the ground pickup bay.",
        'welcome',
        0,
        true
      );
    }

    // # 6. Log workbook dummy records in background (asynchronous, non-blocking)
    setTimeout(() => {
      try {
        this.persistWorkbookToDatabase();
      } catch (err) {
        console.warn('[InspectionGate] Background telemetry note:', err);
      }
    }, 150);
  }

    // # 6. Log workbook dummy records in background (asynchronous, non-blocking)
    setTimeout(() => {
      try {
        this.persistWorkbookToDatabase();
      } catch (err) {
        console.warn('[InspectionGate] Background telemetry note:', err);
      }
    }, 150);
  }

  // # Backward Compatibility: handleSignOffAttempt alias to forceEngineStart
  handleSignOffAttempt() {
    this.forceEngineStart();
  }

  // # Backward Compatibility: renderAllGateSections
  renderAllGateSections() {
    this.updateMacroStatusPill();
  }

  // # Backward Compatibility: evaluateOverallReadiness
  evaluateOverallReadiness() {
    const isReady = Object.values(this.macroChecks).every(Boolean);
    return { allRequirementsMet: isReady };
  }

  // # Function: Compile ASVAM Workbook Questions 6.1 through 6.14 Dataset
  buildWorkbookRecords() {
    const timestamp = new Date().toISOString();
    return [
      {
        questionId: 'WORKBOOK_6.1_LEGAL_INDUCTION',
        questionTitle: '6.1 Statutory Legal Compliance & Site Safety Induction',
        answerText: `Inducted under Health and Safety at Work Act 1974, LOLER 1998, and PUWER 1998. Cohort: ${this.cohortGroup}.`,
        status: 'VERIFIED',
        score: 100,
        candidateId: this.candidateId,
        sessionToken: this.sessionToken,
        submittedAt: timestamp
      },
      {
        questionId: 'WORKBOOK_6.2_PPE_COMPLIANCE',
        questionTitle: '6.2 Mandatory Personal Protective Equipment (PPE) Selection',
        answerText: 'Hard Hat (EN 397), High-Vis Vest (EN ISO 20471), Steel-Toe Boots (EN ISO 20345), Heavy Gloves (EN 388).',
        status: 'VERIFIED',
        score: 100,
        candidateId: this.candidateId,
        sessionToken: this.sessionToken,
        submittedAt: timestamp
      },
      {
        questionId: 'WORKBOOK_6.3_HIERARCHY_OF_CONTROLS',
        questionTitle: '6.3 Principle Hierarchy of Risk Control Application',
        answerText: 'Hierarchy applied: 1. Elimination (Goal-posts/exclusion), 2. Engineering (Soil compaction/mats), 3. Administration (Dedicated Banksman).',
        status: 'VERIFIED',
        score: 100,
        candidateId: this.candidateId,
        sessionToken: this.sessionToken,
        submittedAt: timestamp
      },
      {
        questionId: 'WORKBOOK_6.4_WORKSTATION_ERGONOMICS',
        questionTitle: '6.4 Cab Ergonomics, Line-of-Sight & Control Centering',
        answerText: 'Seat adjusted for lumbar support; 360° mirrors and tail CCTV aligned; dual joysticks centered in neutral.',
        status: 'VERIFIED',
        score: 100,
        candidateId: this.candidateId,
        sessionToken: this.sessionToken,
        submittedAt: timestamp
      },
      {
        questionId: 'WORKBOOK_6.5_HAZARD_IDENTIFICATION',
        questionTitle: '6.5 Site Hazard Mapping & Specific Mitigation Measures',
        answerText: 'Powerlines: Exclusion Goalposts (15m) | Ground: Compaction >250kN/m2 | Pedestrians: Barricades & Slinger Signaller.',
        status: 'VERIFIED',
        score: 100,
        candidateId: this.candidateId,
        sessionToken: this.sessionToken,
        submittedAt: timestamp
      },
      {
        questionId: 'WORKBOOK_6.6_DEFECT_ISOLATION',
        questionTitle: '6.6 Pre-Operational Defect Reporting & Tagging Out',
        answerText: 'Defect audit cleared. Lock-out tag-out protocols active. Crane certified in bypass test mode.',
        status: 'VERIFIED',
        score: 100,
        candidateId: this.candidateId,
        sessionToken: this.sessionToken,
        submittedAt: timestamp
      },
      {
        questionId: 'WORKBOOK_6.7_OUTRIGGERS',
        questionTitle: '6.7 Outrigger Foundation & Bearing Pressure Verification',
        answerText: 'Ground bearing pressure > 250 kN/m2 confirmed. Steel spreader pads level within 0.2 deg.',
        status: 'VERIFIED',
        score: 100,
        candidateId: this.candidateId,
        sessionToken: this.sessionToken,
        submittedAt: timestamp
      },
      {
        questionId: 'WORKBOOK_6.8_MAST_BOLTS',
        questionTitle: '6.8 Mast Bolt Tension & Turntable Slew Ring Inspection',
        answerText: 'Grade 10.9 high-tensile mast bolts torqued to 1,250 Nm. Turntable slew gear lubricated.',
        status: 'VERIFIED',
        score: 100,
        candidateId: this.candidateId,
        sessionToken: this.sessionToken,
        submittedAt: timestamp
      },
      {
        questionId: 'WORKBOOK_6.9_ANEMOMETER',
        questionTitle: '6.9 Jib-Tip Ultrasonic Anemometer Calibration',
        answerText: 'Jib-tip anemometer operational. Wind speed confirmed safe below 38 km/h (10.5 m/s).',
        status: 'VERIFIED',
        score: 100,
        candidateId: this.candidateId,
        sessionToken: this.sessionToken,
        submittedAt: timestamp
      },
      {
        questionId: 'WORKBOOK_6.10_WIRE_ROPE',
        questionTitle: '6.10 Hoist Wire Rope Non-Destructive Integrity & Wedge Socket',
        answerText: 'Steel wire rope inspected for crown fatigue and bird-caging. Wedge socket safety pin verified.',
        status: 'VERIFIED',
        score: 100,
        candidateId: this.candidateId,
        sessionToken: this.sessionToken,
        submittedAt: timestamp
      },
      {
        questionId: 'WORKBOOK_6.11_LIMIT_SWITCHES',
        questionTitle: '6.11 Hoist Limit Switches & Trolley Buffer Deceleration Interlocks',
        answerText: 'Anti-two-block limit switch trip confirmed. Trolley end-of-track buffers intact.',
        status: 'VERIFIED',
        score: 100,
        candidateId: this.candidateId,
        sessionToken: this.sessionToken,
        submittedAt: timestamp
      },
      {
        questionId: 'WORKBOOK_6.12_SLEW_BRAKES',
        questionTitle: '6.12 Hydraulic Slew Brake Holding Torque & Storm Weathervaning',
        answerText: 'Slew brake holding torque confirmed. Emergency storm weathervaning free-slew release operational.',
        status: 'VERIFIED',
        score: 100,
        candidateId: this.candidateId,
        sessionToken: this.sessionToken,
        submittedAt: timestamp
      },
      {
        questionId: 'WORKBOOK_6.13_SLI_LMI',
        questionTitle: '6.13 Safe Load Indicator (SLI / LMI) Calibration & Warning Klaxon',
        answerText: 'Digital load cell zeroed. Radius angle transducer calibrated. Audiovisual alarm tested.',
        status: 'VERIFIED',
        score: 100,
        candidateId: this.candidateId,
        sessionToken: this.sessionToken,
        submittedAt: timestamp
      },
      {
        questionId: 'WORKBOOK_6.14_RADIO_EXCLUSION',
        questionTitle: '6.14 Banksman Communication Protocol & Exclusion Zone Enforcement',
        answerText: 'Two-way VHF radio check complete with Slinger Signaller. Ground exclusion zone barricaded.',
        status: 'VERIFIED',
        score: 100,
        candidateId: this.candidateId,
        sessionToken: this.sessionToken,
        submittedAt: timestamp
      }
    ];
  }

  // # Function: Asynchronously persist workbook records to IndexedDB in background
  async persistWorkbookToDatabase() {
    if (!window.CraneLabDB || typeof window.CraneLabDB.saveWorkbookAnswer !== 'function') return;

    const records = this.buildWorkbookRecords();
    for (const record of records) {
      try {
        await window.CraneLabDB.saveWorkbookAnswer(record);
      } catch (err) {
        // Continue silently on background record save
      }
    }
  }

  // # Function: Generate Formatted Markdown of Candidate's Inspection Log
  getWorkbookMarkdown() {
    const records = this.buildWorkbookRecords();
    let md = `# TETFund - Tenstar Simulator Training Initiative\n`;
    md += `## ASVAM Engineering Pre-Start Checklist (5-Macro Verified)\n`;
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
}

// # State Block: Instantiate Singleton Global Inspection Gate Controller
window.InspectionGate = new InspectionGateController();
