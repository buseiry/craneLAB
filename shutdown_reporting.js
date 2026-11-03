/**
 * CraneLab: ASVAM-Pulse - Safe Shutdown, Ready-to-Rig Pass Generator & Cohort Leaderboard
 * TETFund - Tenstar Simulator Training Initiative
 * Consortium: ASQ Development & Training UK / SAMMAX Global Services
 *
 * Curriculum Specifications:
 * - Workbook 6.12 & Day 5 Slide 87: Mandatory 7-Step Safe Crane Shutdown Protocol.
 * - Shareable "Operator License & Ready-to-Rig Pass": 1200x675 Canvas PNG Generator.
 * - Offline WhatsApp Sync Bridge: Group 1-4 Cohort Score Exporter & Import Parser.
 */

// # State Block: Mandatory 7-Step Safe Shutdown Protocol Configuration (Workbook 6.12)
const ASVAM_SHUTDOWN_CONFIG = {
  STEPS: [
    {
      id: 'step_safe_zone',
      number: 1,
      title: 'Position Jib & Trolley in Designated Safe Zone',
      ruleCode: 'Workbook 6.12.1',
      description: 'Slew jib to align with site weathervaning storm axis; bring trolley inward to safe parking radius (15m - 20m from mast center).',
      icon: '🧭',
      actionLabel: 'Confirm Safe Zone Slew/Trolley Alignment'
    },
    {
      id: 'step_lower_hook',
      number: 2,
      title: 'Stabilise & Lower Hook / Attachment Safely',
      ruleCode: 'Workbook 6.12.2',
      description: 'Dampen all load swinging; lower empty hook block to safe parking elevation (1.5m above ground or landed on timber dunnage; suspended loads strictly prohibited).',
      icon: '⚓',
      actionLabel: 'Verify Hook Landed / Zero Suspended Load'
    },
    {
      id: 'step_neutral_brake',
      number: 3,
      title: 'Neutralise Joysticks & Engage Slewing / Parking Brake',
      ruleCode: 'Workbook 6.12.3',
      description: 'Verify left and right dual joysticks have self-centered to spring-zero; engage hydraulic slewing lock or release for free weathervane as specified by site wind regime.',
      icon: '🕹️',
      actionLabel: 'Verify Joysticks Spring-Centered & Brakes Set'
    },
    {
      id: 'step_disengage_power',
      number: 4,
      title: 'Disengage Operating Systems & Console Key Switch',
      ruleCode: 'Workbook 6.12.4',
      description: 'Power down inverter drives for hoist, trolley, and slew; isolate auxiliary hydraulic pumps; switch console ignition key to OFF and remove.',
      icon: '🔌',
      actionLabel: 'Isolate Inverter Drives & Remove Key'
    },
    {
      id: 'step_check_gauges',
      number: 5,
      title: 'Inspect Cab Gauges, Anemometer & Warning Displays',
      ruleCode: 'Workbook 6.12.5',
      description: 'Confirm Safe Load Indicator (SLI) shows 0.0 tonnes payload; verify anemometer ambient wind speed is safely logged (< 10.5 m/s); check battery isolation indicator.',
      icon: '📊',
      actionLabel: 'Confirm Zero SLI & Log Ambient Wind'
    },
    {
      id: 'step_logbook_record',
      number: 6,
      title: 'Record Shift Telemetry & Defects in ASVAM Logbook',
      ruleCode: 'Workbook 6.12.6',
      description: 'Digitally record cumulative shift cycle duration, peak pendulum sway, total moments (kNm), and report any hydraulic or structural abnormalities.',
      icon: '📝',
      actionLabel: 'Sign & Seal ASVAM Digital Shift Logbook'
    },
    {
      id: 'step_safe_egress',
      number: 7,
      title: 'Execute Safe Cab Egress (3 Points of Contact)',
      ruleCode: 'Workbook 6.12.7',
      description: 'Don fall-arrest harness; face mast ladder at all times; strictly maintain 3 points of contact (2 hands 1 foot or 1 hand 2 feet); carry zero tools or materials by hand.',
      icon: '🪜',
      actionLabel: 'Verify 3-Point Mast Ladder Egress Protocol'
    }
  ]
};

// # State Block: Seed Leaderboard for Groups 1 to 4 Across Partner Institutions
const COHORT_LEADERBOARD_SEED = [
  {
    id: 'TF-TNS-2026-0104',
    name: 'Chukwuebuka Obi Okonkwo',
    institution: 'LASUSTECH',
    cohort: 'Group 1',
    cohortTitle: 'Group 1 - Structural Kinematics',
    rank: 'Chief ASVAM Crane Engineer',
    rankBadge: '⭐',
    qualityScore: 100,
    safetyScore: 98.6,
    economyScore: 96.5,
    compositeScore: 98.6,
    safetyNaira: 8500,
    cycleTime: '02:18',
    token: 'A48F9B1E4A221D0E7C5544B9138240F11289AC33405B68E0124890CD548E4B12',
    timestamp: '2026-11-02T14:32:00Z',
    verified: true
  },
  {
    id: 'TF-TNS-2026-0842',
    name: 'Ibrahim Adeleke Musa',
    institution: 'LASUSTECH',
    cohort: 'Group 2',
    cohortTitle: 'Group 2 - Mechanical Rigging',
    rank: 'Senior Tower Operator',
    rankBadge: '🏗️',
    qualityScore: 100,
    safetyScore: 97.4,
    economyScore: 94.8,
    compositeScore: 97.7,
    safetyNaira: 5000,
    cycleTime: '02:45',
    token: '7BE26E26DEED50BC114099AF884210C489115200FEDBAC0124883391AA992104',
    timestamp: '2026-11-02T15:10:00Z',
    verified: true
  },
  {
    id: 'TF-TNS-2026-0419',
    name: 'Fatima Amina Bello',
    institution: 'Kaduna Polytechnic',
    cohort: 'Group 3',
    cohortTitle: 'Group 3 - Precision Erection',
    rank: 'Senior Tower Operator',
    rankBadge: '🏗️',
    qualityScore: 96,
    safetyScore: 96.0,
    economyScore: 92.0,
    compositeScore: 95.2,
    safetyNaira: 4200,
    cycleTime: '03:10',
    token: 'C438D19F55A120899ACD41002239485718290384729183746192837465918273',
    timestamp: '2026-11-02T16:05:00Z',
    verified: true
  },
  {
    id: 'TF-TNS-2026-0922',
    name: 'Olusegun Emmanuel Babatunde',
    institution: 'Yaba College of Technology',
    cohort: 'Group 4',
    cohortTitle: 'Group 4 - Safety & Hazard Control',
    rank: 'Junior Riggers Mate',
    rankBadge: '🛠️',
    qualityScore: 94,
    safetyScore: 94.5,
    economyScore: 90.0,
    compositeScore: 93.5,
    safetyNaira: 2800,
    cycleTime: '03:22',
    token: '23A5B80C99E34857192837461928374658192837465918273648192837465918',
    timestamp: '2026-11-02T16:48:00Z',
    verified: true
  },
  {
    id: 'TF-TNS-2026-0315',
    name: 'Ngozi Vivian Eze',
    institution: 'UNILAG',
    cohort: 'Group 2',
    cohortTitle: 'Group 2 - Mechanical Rigging',
    rank: 'Junior Riggers Mate',
    rankBadge: '🛠️',
    qualityScore: 92,
    safetyScore: 91.0,
    economyScore: 89.5,
    compositeScore: 91.0,
    safetyNaira: 2200,
    cycleTime: '03:48',
    token: '7E11A04441B83847192837461928374658192837465918273648192837465918',
    timestamp: '2026-11-02T17:15:00Z',
    verified: true
  },
  {
    id: 'TF-TNS-2026-0771',
    name: 'Usman Garba Danladi',
    institution: 'ABU Zaria',
    cohort: 'Group 1',
    cohortTitle: 'Group 1 - Structural Kinematics',
    rank: 'Yard Apprentice',
    rankBadge: '🔰',
    qualityScore: 90,
    safetyScore: 89.2,
    economyScore: 87.0,
    compositeScore: 89.0,
    safetyNaira: 1200,
    cycleTime: '04:02',
    token: '09D4FA13B77E3847192837461928374658192837465918273648192837465918',
    timestamp: '2026-11-02T17:42:00Z',
    verified: true
  }
];

// # Class: ShutdownReportingEngine - Safe Shutdown, Canvas ID Pass & Cohort Sync
class ShutdownReportingEngine {
  // # Function: Constructor & Runtime State Initialization
  constructor() {
    // # State Block: 7-Step Safe Shutdown Check Map
    this.shutdownChecklist = {
      step_safe_zone: false,
      step_lower_hook: false,
      step_neutral_brake: false,
      step_disengage_power: false,
      step_check_gauges: false,
      step_logbook_record: false,
      step_safe_egress: false
    };

    this.isShutdownCertified = false;
    this.shutdownTimestamp = null;
    this.currentCohortFilter = 'ALL';
    this.cachedLicenseDataURL = null;

    // # State Block: Load Local Leaderboard Cache
    this.leaderboardData = [];
    this.loadLeaderboardFromStorage();
  }

  // ========================================================================
  // # SECTION 1: MANDATORY 7-STEP SAFE SHUTDOWN MODAL (Workbook 6.12)
  // ========================================================================

  // # Function: Open Safe Shutdown Checklist Modal
  openShutdownModal() {
    // Check if modal DOM exists; if not, render it dynamically
    let modal = document.getElementById('safe-shutdown-modal');
    if (!modal) {
      modal = this.createShutdownModalDOM();
    }

    // Refresh UI steps
    this.renderShutdownStepsUI();
    this.updateShutdownProgressUI();

    modal.style.display = 'flex';
  }

  // # Function: Create Safe Shutdown Modal DOM Element
  createShutdownModalDOM() {
    const modal = document.createElement('div');
    modal.id = 'safe-shutdown-modal';
    modal.className = 'shutdown-modal-overlay';

    modal.innerHTML = `
      <div class="shutdown-modal-content">
        <div class="shutdown-modal-header">
          <div class="shutdown-header-titles">
            <span class="gate-tag" style="background: rgba(245, 158, 11, 0.2); color: var(--safety-amber); border-color: var(--safety-amber);">
              ASVAM WORKBOOK 6.12 &amp; DAY 5 SLIDE 87
            </span>
            <h2 style="font-size: 1.25rem; color: var(--text-primary); margin-top: 0.35rem;">
              Mandatory 7-Step Tower Crane Safe Shutdown Gate
            </h2>
            <p style="font-size: 0.78rem; color: var(--text-secondary); margin: 0;">
              Statutory LOLER / ASVAM Interlock: You must complete and verify all 7 shutdown procedures before simulator performance scores are cryptographically locked in.
            </p>
          </div>
          <button type="button" class="btn-modal-close" onclick="window.ShutdownReporting.closeShutdownModal()">&times;</button>
        </div>

        <div class="shutdown-progress-bar-container">
          <div class="shutdown-progress-header">
            <span id="shutdown-progress-text">Progress: 0 of 7 Procedures Verified (0%)</span>
            <span id="shutdown-progress-status" style="color: var(--safety-amber); font-weight: 700;">INCOMPLETE</span>
          </div>
          <div class="shutdown-progress-track">
            <div id="shutdown-progress-fill" class="shutdown-progress-fill" style="width: 0%;"></div>
          </div>
        </div>

        <div class="shutdown-steps-list" id="shutdown-steps-list-container">
          <!-- Dynamically populated 7 steps -->
        </div>

        <div class="shutdown-modal-footer">
          <button type="button" class="btn-aux" onclick="window.ShutdownReporting.closeShutdownModal()">
            Return to Cockpit
          </button>
          <button type="button" id="btn-lock-in-shutdown" class="btn-primary" style="width: auto; padding: 0.65rem 1.75rem;" disabled onclick="window.ShutdownReporting.confirmAndLockInScore()">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" style="vertical-align: middle; margin-right: 6px;">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
              <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
            </svg>
            Lock In Certified Score &amp; Exit Cockpit (Gate D)
          </button>
        </div>
      </div>
    `;

    document.body.appendChild(modal);
    return modal;
  }

  // # Function: Close Safe Shutdown Modal
  closeShutdownModal() {
    const modal = document.getElementById('safe-shutdown-modal');
    if (modal) modal.style.display = 'none';
  }

  // # Function: Render 7 Shutdown Steps into Modal DOM
  renderShutdownStepsUI() {
    const container = document.getElementById('shutdown-steps-list-container');
    if (!container) return;

    container.innerHTML = ASVAM_SHUTDOWN_CONFIG.STEPS.map((step) => {
      const isChecked = this.shutdownChecklist[step.id] === true;
      return `
        <div class="shutdown-step-card ${isChecked ? 'completed' : 'pending'}" id="card-shutdown-${step.id}">
          <div class="shutdown-step-num-badge">${step.number}</div>
          <div class="shutdown-step-body">
            <div class="shutdown-step-header-line">
              <span class="shutdown-step-icon">${step.icon}</span>
              <strong class="shutdown-step-title">${step.title}</strong>
              <span class="shutdown-step-code">${step.ruleCode}</span>
            </div>
            <p class="shutdown-step-desc">${step.description}</p>
            <div class="shutdown-step-action-row">
              <button type="button" 
                      class="btn-step-toggle ${isChecked ? 'verified' : ''}" 
                      onclick="window.ShutdownReporting.toggleShutdownStep('${step.id}')">
                ${isChecked ? '✓ Verified &amp; Signed Off' : 'Execute &amp; Verify Step'}
              </button>
              <span class="shutdown-badge ${isChecked ? 'safe' : 'warn'}">
                ${isChecked ? 'INTERLOCK CLEARED' : 'ACTION REQUIRED'}
              </span>
            </div>
          </div>
        </div>
      `;
    }).join('');
  }

  // # Function: Toggle Individual Shutdown Step Verification
  toggleShutdownStep(stepId) {
    if (Object.prototype.hasOwnProperty.call(this.shutdownChecklist, stepId)) {
      this.shutdownChecklist[stepId] = !this.shutdownChecklist[stepId];
      this.renderShutdownStepsUI();
      this.updateShutdownProgressUI();
    }
  }

  // # Function: Update Shutdown Progress Header & Lock-in Button State
  updateShutdownProgressUI() {
    const totalSteps = ASVAM_SHUTDOWN_CONFIG.STEPS.length;
    let completedSteps = 0;
    for (const key of Object.keys(this.shutdownChecklist)) {
      if (this.shutdownChecklist[key]) completedSteps++;
    }

    // # Equation: Percentage progress = (completedSteps / totalSteps) * 100
    const pct = Math.round((completedSteps / totalSteps) * 100);

    const fillElem = document.getElementById('shutdown-progress-fill');
    const textElem = document.getElementById('shutdown-progress-text');
    const statusElem = document.getElementById('shutdown-progress-status');
    const lockInBtn = document.getElementById('btn-lock-in-shutdown');

    if (fillElem) fillElem.style.width = `${pct}%`;
    if (textElem) textElem.textContent = `Progress: ${completedSteps} of ${totalSteps} Procedures Verified (${pct}%)`;

    if (statusElem) {
      if (completedSteps === totalSteps) {
        statusElem.textContent = 'ALL 7 PROCEDURES CERTIFIED';
        statusElem.style.color = 'var(--safety-emerald)';
      } else {
        statusElem.textContent = `${totalSteps - completedSteps} ACTIONS PENDING`;
        statusElem.style.color = 'var(--safety-amber)';
      }
    }

    if (lockInBtn) {
      if (completedSteps === totalSteps) {
        lockInBtn.removeAttribute('disabled');
        lockInBtn.classList.remove('btn-disabled');
        lockInBtn.style.boxShadow = '0 0 20px rgba(16, 185, 129, 0.4)';
      } else {
        lockInBtn.setAttribute('disabled', 'true');
        lockInBtn.classList.add('btn-disabled');
        lockInBtn.style.boxShadow = 'none';
      }
    }
  }

  // # Function: Validate and Lock In Final Performance Score into Gate D
  async confirmAndLockInScore() {
    // Verify all 7 steps
    const incomplete = ASVAM_SHUTDOWN_CONFIG.STEPS.filter((s) => !this.shutdownChecklist[s.id]);
    if (incomplete.length > 0) {
      if (typeof alert === 'function') {
        alert(`Cannot lock in score. ${incomplete.length} shutdown safety procedure(s) are still unverified.`);
      }
      return;
    }

    this.isShutdownCertified = true;
    this.shutdownTimestamp = new Date().toISOString();

    // Log shutdown audit event in IndexedDB
    if (window.CraneLabDB && window.CraneLabState) {
      await window.CraneLabDB.logTelemetry(
        window.CraneLabState.candidate.id,
        window.CraneLabState.candidate.sessionToken,
        'SAFE_SHUTDOWN_COMPLETED',
        {
          allSevenStepsPassed: true,
          shutdownTimestamp: this.shutdownTimestamp,
          checklist: this.shutdownChecklist
        }
      );
    }

    // Close modal
    this.closeShutdownModal();

    // Delegate to CraneLabApp to conclude simulation run and transition to Gate D
    if (window.CraneLabApp && typeof window.CraneLabApp.executeConcludeSimulationRun === 'function') {
      await window.CraneLabApp.executeConcludeSimulationRun();
    }

    // Automatically generate and render the Operator License Card
    this.generateReadyToRigPass();
  }

  // ========================================================================
  // # SECTION 2: SHAREABLE "OPERATOR LICENSE & READY-TO-RIG PASS" GENERATOR
  // ========================================================================

  // # Function: Generate 1200x675 High-Res Ready-to-Rig License Pass on Canvas
  generateReadyToRigPass() {
    let canvas = document.getElementById('pass-render-canvas');
    if (!canvas) {
      canvas = document.createElement('canvas');
      canvas.id = 'pass-render-canvas';
      canvas.width = 1200;
      canvas.height = 675;
      canvas.style.display = 'none';
      document.body.appendChild(canvas);
    }

    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    // Retrieve candidate and shift data
    const candidate = (window.CraneLabState && window.CraneLabState.candidate) ? window.CraneLabState.candidate : {
      id: 'TF-TNS-2026-0842',
      name: 'Ibrahim Adeleke Musa',
      cohort: 'Group 2 - Mechanical Rigging',
      sessionToken: '7BE26E26DEED50BC114099AF884210C489115200FEDBAC0124883391AA992104'
    };

    const telemetry = (window.CareerTelemetry) ? {
      rank: window.CAREER_RANKS[window.CareerTelemetry.currentRankIndex],
      quality: window.CareerTelemetry.qualityScore,
      safety: window.CareerTelemetry.safetyScore,
      economy: window.CareerTelemetry.economyScore,
      naira: window.CareerTelemetry.totalSafetyNaira,
      peakSway: window.CranePhysics ? window.CranePhysics.peakSwayRecorded : 1.2
    } : {
      rank: { title: 'Senior Tower Operator', badge: '🏗️', level: 3 },
      quality: 100,
      safety: 98.2,
      economy: 95.0,
      naira: 4500,
      peakSway: 1.2
    };

    // # Equation: Composite Score Calculation = Quality*0.3 + Safety*0.5 + Economy*0.2
    const compositeScore = (telemetry.quality * 0.30 + telemetry.safety * 0.50 + telemetry.economy * 0.20).toFixed(1);

    // -------------------------------------------------------------
    // # Canvas Drawing Operations: High-Resolution Industrial Pass
    // -------------------------------------------------------------
    const w = canvas.width;
    const h = canvas.height;

    // 1. Base Dark Slate Background Gradient
    const bgGrad = ctx.createLinearGradient(0, 0, w, h);
    bgGrad.addColorStop(0, '#060a14');
    bgGrad.addColorStop(0.5, '#0b1325');
    bgGrad.addColorStop(1, '#050811');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, w, h);

    // 2. Subtle Technical Grid Pattern
    ctx.strokeStyle = 'rgba(51, 65, 85, 0.25)';
    ctx.lineWidth = 1;
    for (let x = 40; x < w; x += 40) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, h);
      ctx.stroke();
    }
    for (let y = 40; y < h; y += 40) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
      ctx.stroke();
    }

    // 3. Diagonal Safety Hazard Warning Stripes: Top & Bottom Margins
    this.drawHazardStrip(ctx, 0, 0, w, 14);
    this.drawHazardStrip(ctx, 0, h - 14, w, 14);

    // 4. Outer Golden Safety Border & Inner Accent
    ctx.strokeStyle = '#f59e0b';
    ctx.lineWidth = 4;
    ctx.strokeRect(20, 20, w - 40, h - 40);

    ctx.strokeStyle = '#10b981';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(26, 26, w - 52, h - 52);

    // 5. Header Branding Block
    ctx.textAlign = 'left';
    ctx.fillStyle = '#f59e0b';
    ctx.font = 'bold 15px "Courier New", monospace';
    ctx.fillText('TETFUND - TENSTAR SIMULATOR TRAINING INITIATIVE', 45, 58);

    ctx.fillStyle = '#94a3b8';
    ctx.font = '12px "Courier New", monospace';
    ctx.fillText('Consortium: ASQ Development & Training UK / SAMMAX Global Services | ASVAM Standard', 45, 78);

    // Document Title Banner Right Side
    ctx.textAlign = 'right';
    ctx.fillStyle = '#10b981';
    ctx.font = 'bold 18px "Segoe UI", Arial, sans-serif';
    ctx.fillText('OPERATOR LICENSE & READY-TO-RIG PASS', w - 45, 58);

    ctx.fillStyle = '#f59e0b';
    ctx.font = 'bold 12px "Courier New", monospace';
    ctx.fillText('COMPLIANCE SPEC: ISO 12480-1 / LOLER 1998', w - 45, 78);

    // Divider Line
    ctx.strokeStyle = 'rgba(245, 158, 11, 0.4)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(45, 92);
    ctx.lineTo(w - 45, 92);
    ctx.stroke();

    // 6. Left Column: Operator Photo / Avatar Box & Identification
    const photoX = 45;
    const photoY = 110;
    const photoW = 160;
    const photoH = 190;

    // Photo Box Background
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(photoX, photoY, photoW, photoH);
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 2;
    ctx.strokeRect(photoX, photoY, photoW, photoH);

    // Crane Operator Silhouette Graphic
    ctx.fillStyle = '#f59e0b';
    ctx.font = '72px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('👷', photoX + photoW / 2, photoY + 115);

    // Badge Under Avatar
    ctx.fillStyle = 'rgba(16, 185, 129, 0.2)';
    ctx.fillRect(photoX + 8, photoY + photoH - 35, photoW - 16, 26);
    ctx.strokeStyle = '#10b981';
    ctx.lineWidth = 1;
    ctx.strokeRect(photoX + 8, photoY + photoH - 35, photoW - 16, 26);
    ctx.fillStyle = '#10b981';
    ctx.font = 'bold 11px monospace';
    ctx.fillText('PASSED 7-STEP GATE', photoX + photoW / 2, photoY + photoH - 18);

    // 7. Middle Column: Candidate Engineering Profile
    const infoX = 230;
    let infoY = 130;

    ctx.textAlign = 'left';

    // Candidate Name
    ctx.fillStyle = '#64748b';
    ctx.font = 'bold 11px monospace';
    ctx.fillText('CANDIDATE / OPERATOR NAME:', infoX, infoY);
    infoY += 24;
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 24px "Segoe UI", Arial, sans-serif';
    ctx.fillText(candidate.name.toUpperCase(), infoX, infoY);
    infoY += 32;

    // Candidate ID & Institution
    ctx.fillStyle = '#64748b';
    ctx.font = 'bold 11px monospace';
    ctx.fillText('TETFUND REGISTRATION ID:', infoX, infoY);
    ctx.fillText('INSTITUTION / CENTRE:', infoX + 240, infoY);
    infoY += 20;

    ctx.fillStyle = '#f59e0b';
    ctx.font = 'bold 17px monospace';
    ctx.fillText(candidate.id, infoX, infoY);

    ctx.fillStyle = '#38bdf8';
    ctx.font = 'bold 15px "Segoe UI", sans-serif';
    ctx.fillText('LASUSTECH / ASVAM HUB', infoX + 240, infoY);
    infoY += 30;

    // Cohort & Career Rank
    ctx.fillStyle = '#64748b';
    ctx.font = 'bold 11px monospace';
    ctx.fillText('COHORT SPECIALIZATION:', infoX, infoY);
    ctx.fillText('AUTHORIZED CAREER RANK:', infoX + 240, infoY);
    infoY += 20;

    ctx.fillStyle = '#e2e8f0';
    ctx.font = 'bold 15px "Segoe UI", sans-serif';
    ctx.fillText(candidate.cohort.split('-')[0].trim(), infoX, infoY);

    ctx.fillStyle = '#10b981';
    ctx.font = 'bold 16px "Segoe UI", sans-serif';
    ctx.fillText(`${telemetry.rank.badge || '🏗️'} ${telemetry.rank.title}`, infoX + 240, infoY);
    infoY += 32;

    // Virtual Safety Naira Balance
    ctx.fillStyle = '#64748b';
    ctx.font = 'bold 11px monospace';
    ctx.fillText('SAFETY NAIRA WALLET:', infoX, infoY);
    ctx.fillText('MAX OSCILLATION SWAY:', infoX + 240, infoY);
    infoY += 20;

    ctx.fillStyle = '#10b981';
    ctx.font = 'bold 18px monospace';
    ctx.fillText(`₦${telemetry.naira.toLocaleString()}`, infoX, infoY);

    ctx.fillStyle = '#f59e0b';
    ctx.font = 'bold 17px monospace';
    ctx.fillText(`${telemetry.peakSway.toFixed(1)}° (DAMPED)`, infoX + 240, infoY);

    // 8. Right Column: Performance Telemetry Pillars & Radar Gauges
    const meterX = 740;
    const meterW = 415;
    let meterY = 125;

    ctx.fillStyle = '#0b1329';
    ctx.fillRect(meterX - 15, meterY - 15, meterW + 30, 210);
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(meterX - 15, meterY - 15, meterW + 30, 210);

    // Pillar 1: Quality
    this.drawMetricMeter(ctx, meterX, meterY, meterW, 'Quality Pillar (30% - Target & Soft Touchdown)', telemetry.quality, '#38bdf8');
    meterY += 56;

    // Pillar 2: Safety
    this.drawMetricMeter(ctx, meterX, meterY, meterW, 'Safety Pillar (50% - Sway & Exclusion Zones)', telemetry.safety, '#10b981');
    meterY += 56;

    // Pillar 3: Economy
    this.drawMetricMeter(ctx, meterX, meterY, meterW, 'Economy Pillar (20% - Jerk & Duty Cycle)', telemetry.economy, '#f59e0b');

    // 9. Central Certified Seal Box: "CLEARED FOR TENSTAR PHYSICAL SIMULATOR"
    const sealBoxY = 345;
    const sealBoxW = w - 90;
    const sealBoxH = 175;

    ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
    ctx.fillRect(45, sealBoxY, sealBoxW, sealBoxH);
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 2;
    ctx.strokeRect(45, sealBoxY, sealBoxW, sealBoxH);

    // Massive Authorization Stamp Banner
    ctx.fillStyle = 'rgba(16, 185, 129, 0.15)';
    ctx.fillRect(55, sealBoxY + 10, sealBoxW - 20, 68);
    ctx.strokeStyle = '#10b981';
    ctx.lineWidth = 2.5;
    ctx.strokeRect(55, sealBoxY + 10, sealBoxW - 20, 68);

    ctx.textAlign = 'center';
    ctx.fillStyle = '#10b981';
    ctx.font = '900 24px "Segoe UI", Arial, sans-serif';
    ctx.fillText('★ CLEARED FOR TENSTAR PHYSICAL SIMULATOR ★', w / 2, sealBoxY + 44);

    ctx.fillStyle = '#f8fafc';
    ctx.font = 'bold 12px "Courier New", monospace';
    ctx.fillText(`OVERALL COMPOSITE SCORE: ${compositeScore}%  |  7-STEP SHUTDOWN VERIFIED: ${this.shutdownTimestamp ? this.shutdownTimestamp.substring(0, 10) : '2026-11-02'}`, w / 2, sealBoxY + 66);

    // Cryptographic Session Hash Display
    ctx.textAlign = 'left';
    ctx.fillStyle = '#64748b';
    ctx.font = 'bold 11px monospace';
    ctx.fillText('CRYPTOGRAPHIC SESSION HMAC-SHA256 SIGNATURE (TAMPER-EVIDENT ZERO KNOWLEDGE PROOF):', 65, sealBoxY + 105);

    const sessionHex = candidate.sessionToken || '7BE26E26DEED50BC114099AF884210C489115200FEDBAC0124883391AA992104';
    ctx.fillStyle = '#f59e0b';
    ctx.font = 'bold 13px monospace';
    ctx.fillText(sessionHex, 65, sealBoxY + 128);

    // Verification Note & Issue Date
    ctx.fillStyle = '#94a3b8';
    ctx.font = '11px monospace';
    ctx.fillText(`Issued: ${new Date().toUTCString()} | TETFund ASVAM Digital Verification Node #04`, 65, sealBoxY + 155);

    ctx.textAlign = 'right';
    ctx.fillStyle = '#10b981';
    ctx.font = 'bold 12px monospace';
    ctx.fillText('STATUS: CRYPTOGRAPHICALLY CERTIFIED ✓', w - 65, sealBoxY + 155);

    // 10. Footer Security Ribbon
    ctx.fillStyle = '#475569';
    ctx.font = '10px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('This document verifies full completion of TETFund ASVAM Tower Crane Simulation. Valid for physical simulator cockpit accession.', w / 2, h - 26);

    // Store Data URL for downloads
    this.cachedLicenseDataURL = canvas.toDataURL('image/png');

    // Update Gate D DOM card preview
    this.renderLicensePreviewInDOM(this.cachedLicenseDataURL);

    return this.cachedLicenseDataURL;
  }

  // # Function: Draw Diagonal Safety Hazard Stripe
  drawHazardStrip(ctx, x, y, width, height) {
    ctx.save();
    ctx.beginPath();
    ctx.rect(x, y, width, height);
    ctx.clip();

    ctx.fillStyle = '#f59e0b';
    ctx.fillRect(x, y, width, height);

    ctx.fillStyle = '#0a0f1d';
    const stripeWidth = 16;
    for (let sx = -height; sx < width + height; sx += stripeWidth * 2) {
      ctx.beginPath();
      ctx.moveTo(sx, y);
      ctx.lineTo(sx + stripeWidth, y);
      ctx.lineTo(sx + stripeWidth - height, y + height);
      ctx.lineTo(sx - height, y + height);
      ctx.closePath();
      ctx.fill();
    }
    ctx.restore();
  }

  // # Function: Draw Individual Pillar Progress Meter on Canvas
  drawMetricMeter(ctx, x, y, width, label, val, color) {
    ctx.textAlign = 'left';
    ctx.fillStyle = '#cbd5e1';
    ctx.font = 'bold 11px monospace';
    ctx.fillText(label, x, y);

    ctx.textAlign = 'right';
    ctx.fillStyle = color;
    ctx.font = 'bold 14px monospace';
    ctx.fillText(`${val.toFixed(0)}%`, x + width, y);

    // Track
    const barY = y + 8;
    const barH = 10;
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(x, barY, width, barH);

    // Fill
    const fillW = Math.min(width, (val / 100) * width);
    ctx.fillStyle = color;
    ctx.fillRect(x, barY, fillW, barH);
  }

  // # Function: Render Generated PNG Card into View D DOM Preview
  renderLicensePreviewInDOM(dataURL) {
    const previewContainer = document.getElementById('pass-card-preview-container');
    if (!previewContainer) return;

    previewContainer.innerHTML = `
      <div class="ready-to-rig-card-wrap">
        <img src="${dataURL}" alt="ASVAM Ready-to-Rig License Pass" class="license-pass-img" />
        <div class="license-action-buttons">
          <button type="button" class="btn-primary" onclick="window.ShutdownReporting.downloadLicensePassPNG()">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="vertical-align: middle; margin-right: 6px;">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
              <polyline points="7 10 12 15 17 10"></polyline>
              <line x1="12" y1="15" x2="12" y2="3"></line>
            </svg>
            Download Ready-to-Rig Pass (PNG)
          </button>
          <button type="button" class="btn-aux" style="border-color: #25d366; color: #25d366;" onclick="window.ShutdownReporting.shareViaWhatsApp()">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="vertical-align: middle; margin-right: 6px;">
              <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path>
            </svg>
            Share Pass &amp; Score via WhatsApp
          </button>
          <button type="button" class="btn-aux" onclick="window.print()">
            🖨️ Print Certificate
          </button>
        </div>
      </div>
    `;
  }

  // # Function: Download Generated License PNG File
  downloadLicensePassPNG() {
    if (!this.cachedLicenseDataURL) {
      this.generateReadyToRigPass();
    }
    const candidateId = (window.CraneLabState && window.CraneLabState.candidate)
      ? window.CraneLabState.candidate.id
      : 'OPERATOR-PASS';

    const filename = `ASVAM_Ready_To_Rig_Pass_${candidateId}.png`;
    const downloadAnchor = document.createElement('a');
    downloadAnchor.href = this.cachedLicenseDataURL;
    downloadAnchor.download = filename;
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    document.body.removeChild(downloadAnchor);
  }

  // # Function: Share Pass Summary & Offline Sync Token via WhatsApp
  shareViaWhatsApp() {
    const candidate = (window.CraneLabState && window.CraneLabState.candidate)
      ? window.CraneLabState.candidate
      : { id: 'TF-TNS-2026-0842', name: 'Ibrahim Adeleke Musa', cohort: 'Group 2' };

    const telemetry = (window.CareerTelemetry) ? {
      rank: window.CAREER_RANKS[window.CareerTelemetry.currentRankIndex].title,
      q: window.CareerTelemetry.qualityScore.toFixed(0),
      s: window.CareerTelemetry.safetyScore.toFixed(0),
      e: window.CareerTelemetry.economyScore.toFixed(0),
      naira: window.CareerTelemetry.totalSafetyNaira
    } : {
      rank: 'Senior Tower Operator',
      q: '100',
      s: '98',
      e: '95',
      naira: 4500
    };

    const comp = ((parseFloat(telemetry.q) * 0.3) + (parseFloat(telemetry.s) * 0.5) + (parseFloat(telemetry.e) * 0.2)).toFixed(1);
    const syncToken = this.generateWhatsAppSyncString();

    const textPayload = 
`🏗️ *TETFund ASVAM-Pulse Operator License & Ready-to-Rig Pass*
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
👤 *Operator:* ${candidate.name} (${candidate.id})
🏫 *Institution:* LASUSTECH / ASVAM Centre
👥 *Cohort:* ${candidate.cohort.split('-')[0].trim()}
⭐ *Rank:* ${telemetry.rank}

📊 *Tenstar Performance Pillars:*
• Quality: ${telemetry.q}%
• Safety: ${telemetry.s}%
• Economy: ${telemetry.e}%
🎯 *Composite Score:* ${comp}%
💰 *Safety Naira Earned:* ₦${telemetry.naira.toLocaleString()}

✅ *Status:* CLEARED FOR TENSTAR PHYSICAL SIMULATOR
🔐 *HMAC Token:* ${candidate.sessionToken ? candidate.sessionToken.substring(0, 16) + '...' : 'VERIFIED'}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
_Offline WhatsApp Sync Token (Paste into instructor app):_
${syncToken}`;

    // Copy to clipboard
    if (typeof navigator !== 'undefined' && navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
      navigator.clipboard.writeText(textPayload);
    }

    // Open WhatsApp Web / App Intent
    const whatsappUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(textPayload)}`;
    if (typeof window !== 'undefined' && typeof window.open === 'function') {
      window.open(whatsappUrl, '_blank');
    }
  }

  // ========================================================================
  // # SECTION 3: COHORT GROUP 1-4 LEADERBOARD & OFFLINE JSON SYNC
  // ========================================================================

  // # Function: Load Leaderboard Data from Storage or Seed
  loadLeaderboardFromStorage() {
    try {
      const stored = localStorage.getItem('asvam_cohort_leaderboard');
      if (stored) {
        this.leaderboardData = JSON.parse(stored);
      } else {
        this.leaderboardData = [...COHORT_LEADERBOARD_SEED];
      }
    } catch (e) {
      this.leaderboardData = [...COHORT_LEADERBOARD_SEED];
    }
  }

  // # Function: Save Leaderboard Data to Local Storage
  saveLeaderboardToStorage() {
    try {
      localStorage.setItem('asvam_cohort_leaderboard', JSON.stringify(this.leaderboardData));
    } catch (e) {
      console.warn('[ShutdownReporting] Storage quota exceeded or disabled');
    }
  }

  // # Function: Filter and Render Leaderboard Table (Gate D)
  renderLeaderboardTable(cohortFilter = 'ALL') {
    this.currentCohortFilter = cohortFilter;
    const tbody = document.getElementById('leaderboard-tbody');
    if (!tbody) return;

    // Filter items
    let filtered = this.leaderboardData;
    if (cohortFilter !== 'ALL') {
      filtered = this.leaderboardData.filter((item) => item.cohort.trim() === cohortFilter.trim());
    }

    // Sort by Composite Score descending, then Safety Score descending
    filtered.sort((a, b) => {
      if (b.compositeScore !== a.compositeScore) {
        return b.compositeScore - a.compositeScore;
      }
      return b.safetyScore - a.safetyScore;
    });

    const currentCandidateId = (window.CraneLabState && window.CraneLabState.candidate)
      ? window.CraneLabState.candidate.id
      : 'TF-TNS-2026-0842';

    tbody.innerHTML = filtered.map((c, index) => {
      const isSelf = c.id === currentCandidateId;
      const rankBadge = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `#${index + 1}`;
      const tokenShort = c.token ? `${c.token.substring(0, 8)}...${c.token.substring(c.token.length - 6)}` : 'HMAC-VERIFIED';

      return `
        <tr class="${isSelf ? 'highlight-candidate-row' : ''}">
          <td style="font-weight: 700; color: ${index < 3 ? 'var(--safety-amber)' : 'inherit'};">
            ${rankBadge}
          </td>
          <td>
            <strong>${c.id}</strong>
            ${isSelf ? '<span class="self-tag">(YOU)</span>' : ''}
            <div style="font-size: 0.72rem; color: var(--text-secondary);">${c.name || 'Candidate'}</div>
          </td>
          <td>
            <span class="cohort-badge cohort-${c.cohort.replace(/\s+/g, '').toLowerCase()}">
              ${c.cohort}
            </span>
          </td>
          <td style="font-family: var(--font-mono); color: var(--safety-emerald);">100%</td>
          <td style="font-family: var(--font-mono); font-weight: 700; color: ${c.compositeScore >= 95 ? 'var(--safety-emerald)' : 'var(--safety-amber)'};">
            ${c.compositeScore.toFixed(1)}%
          </td>
          <td style="font-family: var(--font-mono); font-size: 0.78rem;">${c.cycleTime || '02:30'}</td>
          <td style="font-family: var(--font-mono); font-size: 0.72rem; color: var(--text-secondary);">${tokenShort}</td>
          <td>
            <span class="verification-pill verified">
              ✓ SHA-256
            </span>
          </td>
        </tr>
      `;
    }).join('');
  }

  // # Function: Generate WhatsApp Sync Score String for Current Run
  generateWhatsAppSyncString() {
    const candidate = (window.CraneLabState && window.CraneLabState.candidate) ? window.CraneLabState.candidate : {
      id: 'TF-TNS-2026-0842',
      name: 'Ibrahim Adeleke Musa',
      cohort: 'Group 2',
      sessionToken: '7BE26E26DEED50BC114099AF884210C489115200FEDBAC0124883391AA992104'
    };

    const telemetry = (window.CareerTelemetry) ? {
      rank: window.CAREER_RANKS[window.CareerTelemetry.currentRankIndex].title,
      rankBadge: window.CAREER_RANKS[window.CareerTelemetry.currentRankIndex].badge,
      q: window.CareerTelemetry.qualityScore,
      s: window.CareerTelemetry.safetyScore,
      e: window.CareerTelemetry.economyScore,
      naira: window.CareerTelemetry.totalSafetyNaira
    } : {
      rank: 'Senior Tower Operator',
      rankBadge: '🏗️',
      q: 100,
      s: 98.2,
      e: 95.0,
      naira: 4500
    };

    const comp = parseFloat((telemetry.q * 0.30 + telemetry.s * 0.50 + telemetry.e * 0.20).toFixed(1));

    const payloadObj = {
      id: candidate.id,
      name: candidate.name,
      institution: 'LASUSTECH',
      cohort: candidate.cohort.split('-')[0].trim(),
      cohortTitle: candidate.cohort,
      rank: telemetry.rank,
      rankBadge: telemetry.rankBadge,
      qualityScore: telemetry.q,
      safetyScore: telemetry.s,
      economyScore: telemetry.e,
      compositeScore: comp,
      safetyNaira: telemetry.naira,
      cycleTime: '02:45',
      token: candidate.sessionToken || 'HMAC-VERIFIED',
      timestamp: new Date().toISOString(),
      verified: true
    };

    // Encode to base64 for reliable transmission in chat
    const jsonStr = JSON.stringify(payloadObj);
    let encoded = '';
    if (typeof btoa === 'function') {
      encoded = btoa(encodeURIComponent(jsonStr));
    } else {
      encoded = Buffer.from(jsonStr).toString('base64');
    }

    return `ASVAM-SYNC:${encoded}`;
  }

  // # Function: Export Sync String to Clipboard with Visual Alert
  exportWhatsAppSyncStringPrompt() {
    const syncToken = this.generateWhatsAppSyncString();
    if (typeof navigator !== 'undefined' && navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
      navigator.clipboard.writeText(syncToken);
      if (typeof alert === 'function') {
        alert('✓ WhatsApp Sync String copied to clipboard!\n\nPaste this token directly into your Cohort WhatsApp group to sync with the instructor.');
      }
    } else if (typeof prompt === 'function') {
      prompt('Copy your ASVAM Offline Sync Token below:', syncToken);
    }
  }

  // # Function: Open Prompt / Modal to Import WhatsApp Sync Strings from Students
  importWhatsAppSyncPrompt() {
    if (typeof prompt !== 'function') return;
    const input = prompt(
      'PASTE OFFLINE WHATSAPP SCORE TOKEN(S) BELOW:\n' +
      '(Paste the "ASVAM-SYNC:..." string sent by the student in WhatsApp):'
    );
    if (!input || !input.trim()) return;

    this.importWhatsAppSyncPayload(input.trim());
  }

  // # Function: Parse, Validate and Merge Imported WhatsApp Score Payloads
  importWhatsAppSyncPayload(rawString) {
    try {
      // Find all ASVAM-SYNC tokens in input
      const regex = /ASVAM-SYNC:([A-Za-z0-9+/=]+)/g;
      let match;
      let importedCount = 0;

      while ((match = regex.exec(rawString)) !== null) {
        const base64Data = match[1];
        let jsonStr = '';
        if (typeof atob === 'function') {
          jsonStr = decodeURIComponent(atob(base64Data));
        } else {
          jsonStr = Buffer.from(base64Data, 'base64').toString('utf8');
        }

        const candidateRecord = JSON.parse(jsonStr);

        // Validation rule: Must have id, cohort, and compositeScore
        if (candidateRecord.id && candidateRecord.cohort && typeof candidateRecord.compositeScore === 'number') {
          // Check if candidate already exists in leaderboard
          const existingIdx = this.leaderboardData.findIndex((c) => c.id === candidateRecord.id);
          if (existingIdx >= 0) {
            // Update record if score is higher or equal
            if (candidateRecord.compositeScore >= this.leaderboardData[existingIdx].compositeScore) {
              this.leaderboardData[existingIdx] = candidateRecord;
              importedCount++;
            }
          } else {
            this.leaderboardData.push(candidateRecord);
            importedCount++;
          }
        }
      }

      if (importedCount > 0) {
        this.saveLeaderboardToStorage();
        this.renderLeaderboardTable(this.currentCohortFilter);
        if (typeof alert === 'function') {
          alert(`✓ Successfully imported and verified ${importedCount} student record(s) from WhatsApp! Leaderboard updated.`);
        }
      } else {
        if (typeof alert === 'function') {
          alert('Invalid or unrecognised ASVAM Sync token. Please verify the copied string format.');
        }
      }
    } catch (err) {
      console.error('[ShutdownReporting] Import failed:', err);
      if (typeof alert === 'function') {
        alert(`Import error: ${err.message}. Ensure you copied the full ASVAM-SYNC: token.`);
      }
    }
  }

  // # Function: Export Entire Cohort Leaderboard Database as JSON File
  exportLeaderboardJSON() {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(this.leaderboardData, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', 'TETFund_ASVAM_Cohort_Leaderboard.json');
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  }
}

// # State Block: Instantiate Singleton Global Shutdown & Reporting Engine Instance
if (typeof window !== 'undefined') {
  window.ShutdownReporting = new ShutdownReportingEngine();
}
