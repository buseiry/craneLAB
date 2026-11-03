/**
 * CraneLab: ASVAM-Pulse - Career Gamification, Tenstar Scoring & IoT Hardware Bridge
 * TETFund - Tenstar Simulator Training Initiative
 * Consortium: ASQ Development & Training UK / SAMMAX Global Services
 *
 * Curriculum Specifications:
 * - "Abuja Crane Life" 4-Stage Career Progression Loop & 3 Shift Contracts.
 * - Live Tenstar Telemetry Pillars: Quality (30%), Safety (50%), Economy (20%).
 * - Dynamic Site Crisis Events: Sudden Abuja Wind Gusts & Radio Static Lost.
 * - Embedded IoT Hardware Bridge: ESP32 + MPU6050 6-DOF IMU & Load Cell Telemetry Schema.
 */

// # State Block: Physical Constants Reference with Local Safe Fallbacks
const PHYSICS_CFG = (typeof window !== 'undefined' && window.CRANE_PHYSICS_CONFIG) ? window.CRANE_PHYSICS_CONFIG : {
  TARGET_ZONE: { radiusM: 28.0, angleDeg: 135.0, heightM: 12.0, toleranceRadiusM: 1.8 },
  OBSTACLES: [
    { name: 'Floor 1 Steel Scaffolding', baseHeightM: 1.0, topHeightM: 4.0, minRM: 16.0, maxRM: 24.0, color: '#475569' },
    { name: 'Floor 2 Brickwork Facade', baseHeightM: 4.0, topHeightM: 8.0, minRM: 16.0, maxRM: 24.0, color: '#64748b' }
  ],
  HOOK_PAYLOAD_MASS_TONNES: 3.5,
  JERK_THRESHOLD_SMOOTH: 4.5
};

// # State Block: Career Progression Ranks & Qualification Thresholds
const CAREER_RANKS = [
  {
    level: 1,
    title: 'Yard Apprentice',
    badge: '🔰',
    minNaira: 0,
    requiredShifts: 0,
    description: 'Ground rigging assistant and basic slinging observer.'
  },
  {
    level: 2,
    title: 'Junior Riggers Mate',
    badge: '🛠️',
    minNaira: 1500,
    requiredShifts: 1,
    description: 'Certified slinger-signaller with basic cabin hook control authorization.'
  },
  {
    level: 3,
    title: 'Senior Tower Operator',
    badge: '🏗️',
    minNaira: 4000,
    requiredShifts: 2,
    description: 'Autonomous high-rise tower crane driver approved for precision steel erection.'
  },
  {
    level: 4,
    title: 'Chief ASVAM Crane Engineer',
    badge: '⭐',
    minNaira: 8000,
    requiredShifts: 3,
    description: 'Master Appointed Person & Heavy Lift Lead for TETFund capital infrastructure.'
  }
];

// # State Block: Progressive Shift Contracts based on Tenstar Simulator Curriculum
const TENSTAR_SHIFT_CONTRACTS = [
  {
    id: 'SHIFT_1_BASIC_LIFTING',
    exerciseCode: 'Tenstar 2.1',
    title: 'Tenstar 2.1: Basic Structural Lift',
    location: 'Abuja Central Logistics Bay',
    contractFeeNaira: 1500,
    benchmarkTimeSec: 180,
    windSpeedMs: 4.2,
    targetRadiusM: 30.0,
    targetAngleDeg: 135.0,
    targetHeightM: 18.0,
    targetFloor: '5th Floor Slab',
    payloadName: 'Steel Rebar Bundle (2.4t)',
    maxPermissibleSwayDeg: 8.0,
    isBlindLift: false,
    briefing: 'Lift Steel Rebar Bundle (2.4t) from Ground Floor Bay (0m) to 5th Floor Slab (18m). Call Ground Crew to hook, lift safely, then call Roof Crew to unhook.'
  },
  {
    id: 'SHIFT_2_PLACING_BEAMS',
    exerciseCode: 'Tenstar 2.3',
    title: 'Tenstar 2.3: Precision I-Beam Placement',
    location: 'TETFund High-Rise Faculty Scaffolding',
    contractFeeNaira: 2500,
    benchmarkTimeSec: 150,
    windSpeedMs: 6.5,
    targetRadiusM: 34.0,
    targetAngleDeg: 150.0,
    targetHeightM: 22.0,
    targetFloor: '6th Floor Roof Deck',
    payloadName: 'Precast Concrete Beam (3.5t)',
    maxPermissibleSwayDeg: 5.0, // # Strict sway constraint (< 5 deg required before lower)
    isBlindLift: false,
    briefing: 'Precision placement of Precast Concrete Beam (3.5t) on 6th Floor Roof Deck (22m). Critical rule: Load sway MUST be under 5.0° before lowering or points deduct.'
  },
  {
    id: 'SHIFT_3_BLIND_LIFT_POUR',
    exerciseCode: 'Tenstar 2.8 & 8.3',
    title: 'Tenstar 2.8 & 8.3: Blind Lift Chiller Placement',
    location: 'Abuja High-Rise Roof Plant Deck',
    contractFeeNaira: 4000,
    benchmarkTimeSec: 210,
    windSpeedMs: 8.0,
    targetRadiusM: 28.0,
    targetAngleDeg: 120.0,
    targetHeightM: 22.0,
    targetFloor: '6th Floor Roof Deck',
    payloadName: 'HVAC Chiller Unit (1.8t)',
    maxPermissibleSwayDeg: 4.5,
    isBlindLift: true, // # Restricted operator vision: must follow signaller commands
    briefing: 'Restricted-visibility lift of HVAC Chiller (1.8t) to 6th Floor Roof Plant Deck behind external facade. Direct visual contact is blocked; operator must follow Banksman radio cues exclusively.'
  }
];

// # State Block: Signaller Command Glossary for Blind Lifts & Radio Protocol
const SIGNALLER_COMMANDS = [
  { id: 'HOLD_ALL', text: 'HOLD ALL - ALL MOTIONS STOP', icon: '🛑', isNeutralRequired: true },
  { id: 'SLEW_RIGHT', text: 'SLEW SLOWLY RIGHT (CLOCKWISE)', icon: '👉', expectedAxis: 'slew', expectedSign: 1 },
  { id: 'SLEW_LEFT', text: 'SLEW SLOWLY LEFT (ANTI-CLOCKWISE)', icon: '👈', expectedAxis: 'slew', expectedSign: -1 },
  { id: 'TROLLEY_OUT', text: 'TROLLEY JIB OUTWARD', icon: '⬆️', expectedAxis: 'trolley', expectedSign: 1 },
  { id: 'TROLLEY_IN', text: 'TROLLEY JIB INWARD', icon: '⬇️', expectedAxis: 'trolley', expectedSign: -1 },
  { id: 'HOIST_LOWER', text: 'LOWER LOAD STEADILY', icon: '⏬', expectedAxis: 'hoist', expectedSign: 1 },
  { id: 'HOIST_RAISE', text: 'INCH HOIST UPWARD', icon: '⏫', expectedAxis: 'hoist', expectedSign: -1 }
];

// # Class: CareerTelemetryEngine - Tenstar Scoring & IoT Bridge Subsystem
class CareerTelemetryEngine {
  // # Function: Constructor initializing career metrics, scoring pillars, and IoT registers
  constructor() {
    // # State Block: Career Player State
    this.totalSafetyNaira = 0;         // # Cumulative earned virtual currency
    this.completedShiftsCount = 0;     // # Number of successfully concluded shifts
    this.currentRankIndex = 0;         // # Pointer to CAREER_RANKS array
    this.activeShiftIndex = 0;         // # Pointer to TENSTAR_SHIFT_CONTRACTS

    // # State Block: Live Tenstar Scoring Pillars (100% Base Scale)
    this.qualityScore = 100.0;         // # Quality: Placement accuracy, landing velocity
    this.safetyScore = 100.0;          // # Safety: Pendulum sway, exclusion zones, obstacle proximity, signaller obedience
    this.economyScore = 100.0;         // # Economy: Input jerkiness (RPM spikes), direction hunting, cycle efficiency

    // # State Block: Scoring Deductions Accumulator
    this.deductions = {
      quality: [],
      safety: [],
      economy: []
    };

    // # State Block: Active Shift Dynamic Tracker
    this.shiftElapsedSec = 0.0;
    this.shiftStartTime = 0;
    this.isShiftActive = false;
    this.isLandingInitiated = false;
    this.reversalCount = 0;
    this.lastTrolleySign = 0;
    this.lastSlewSign = 0;

    // # State Block: Dynamic Site Crisis System (Workbook 6.8, 6.9, 6.10)
    this.activeCrisis = null;          // # null | 'WIND_GUST' | 'RADIO_LOST'
    this.crisisTimerSec = 0.0;         // # Remaining duration of crisis event
    this.crisisTimeLimitSec = 0.0;     // # Reaction countdown for radio contact loss
    this.hasObeyedCrisisReaction = false;
    this.lastCrisisRollTime = 0;

    // # State Block: Banksman / Signaller Blind Lift System
    this.currentSignallerCommandIndex = 0;
    this.lastSignallerCommandTime = 0;
    this.signallerInstructionSec = 6.0;

    // # State Block: Embedded IoT Hardware Bridge (ESP32 + MPU6050)
    this.iotPacketSequence = 1000;
    this.isIoTDrawerOpen = false;
    this.isIoTStreamPaused = false;
    this.latestIoTPacket = null;
    this.iotBaudRate = 115200;

    // # State Block: Performance Loop Ticker
    this.tickerInterval = null;
  }

  // # Function: Initialize Career Subsystem with Candidate Profile
  init(candidateProfile) {
    if (candidateProfile && candidateProfile.nairaBalance) {
      this.totalSafetyNaira = candidateProfile.nairaBalance;
    }
    this.evaluateRankProgression();
    this.renderCareerHUD();
    this.renderIoTDrawer();
    this.startIoTTelemetryStream();
    console.log('[CareerTelemetry] Career Gamification & IoT Hardware Bridge Activated');
  }

  // ========================================================================
  // # SECTION 1: "ABUJA CRANE LIFE" CAREER LOOP & SHIFT CONTRACTS
  // ========================================================================

  // # Function: Select and Activate a Tenstar Shift Contract
  selectShiftContract(contractIndex) {
    if (contractIndex < 0 || contractIndex >= TENSTAR_SHIFT_CONTRACTS.length) {
      contractIndex = 0;
    }
    this.activeShiftIndex = contractIndex;
    const contract = TENSTAR_SHIFT_CONTRACTS[contractIndex];

    // # Reset Tenstar Scoring Pillars to 100%
    this.qualityScore = 100.0;
    this.safetyScore = 100.0;
    this.economyScore = 100.0;
    this.deductions = { quality: [], safety: [], economy: [] };

    this.shiftElapsedSec = 0.0;
    this.shiftStartTime = Date.now();
    this.isShiftActive = true;
    this.reversalCount = 0;
    this.activeCrisis = null;

    // # Configure Physics Engine with Shift Conditions
    if (window.CranePhysics) {
      window.CranePhysics.resetPositions();
      // Adjust wind speed
      const windVal = document.getElementById('hud-wind-val');
      if (windVal) windVal.textContent = contract.windSpeedMs.toFixed(1);
    }

    this.renderCareerHUD();
    console.log(`[CareerTelemetry] Contract Activated: ${contract.title}`);
  }

  // # Function: Evaluate Career Rank Advancement based on Safety Naira & Shifts
  evaluateRankProgression() {
    let earnedRankIndex = 0;
    for (let i = CAREER_RANKS.length - 1; i >= 0; i--) {
      if (this.totalSafetyNaira >= CAREER_RANKS[i].minNaira &&
          this.completedShiftsCount >= CAREER_RANKS[i].requiredShifts) {
        earnedRankIndex = i;
        break;
      }
    }

    if (earnedRankIndex > this.currentRankIndex) {
      this.currentRankIndex = earnedRankIndex;
      const rank = CAREER_RANKS[earnedRankIndex];
      this.notifyRankPromotion(rank);
    }

    this.renderCareerHUD();
  }

  // # Function: Trigger Promotion Alert Banner
  notifyRankPromotion(rank) {
    if (typeof alert === 'function') {
      alert(`🎉 CAREER PROMOTION UNLOCKED!\nYou are now officially recognized as: ${rank.badge} ${rank.title}!\nTETFund ASVAM Level ${rank.level} Authorized.`);
    } else {
      console.log(`[CareerTelemetry] CAREER PROMOTION: ${rank.badge} ${rank.title}`);
    }
  }

  // # Function: Award Virtual Safety Naira Bonus for Successful Load Delivery
  awardLoadDeliveryBonus(amountNaira = 15000) {
    this.totalSafetyNaira += amountNaira;
    console.log(`[CareerTelemetry] Payload Delivery Bonus Awarded: +₦${amountNaira.toLocaleString()}`);

    // Update HUD Career registers
    const nairaVal = document.getElementById('hud-career-naira');
    if (nairaVal) nairaVal.textContent = `₦${this.totalSafetyNaira.toLocaleString()}`;

    // Evaluate Career Promotion
    this.evaluateRankProgression();

    // Trigger visual notification toast
    this.showDeliveryToast(`🎉 PAYLOAD DELIVERED! +₦${amountNaira.toLocaleString()} Safety Naira Credited!`);
  }

  // # Function: Display temporary toast on Cockpit HUD
  showDeliveryToast(message) {
    let toast = document.getElementById('delivery-toast-banner');
    if (!toast) {
      toast = document.createElement('div');
      toast.id = 'delivery-toast-banner';
      toast.className = 'delivery-toast-banner';
      const cockpit = document.querySelector('.simulator-cockpit') || document.body;
      cockpit.appendChild(toast);
    }
    toast.textContent = message;
    toast.style.display = 'block';
    setTimeout(() => {
      if (toast) toast.style.display = 'none';
    }, 3500);
  }

  // ========================================================================
  // # SECTION 2: LIVE TENSTAR TELEMETRY PILLARS & SCORING EQUATIONS
  // ========================================================================

  // # Function: Update Real-Time Scoring Evaluation during active simulation
  // # Arguments: physics (CranePhysicsEngine instance), dt (seconds)
  update(physics, dt) {
    if (!this.isShiftActive || !physics) return;

    this.shiftElapsedSec += dt;
    const contract = TENSTAR_SHIFT_CONTRACTS[this.activeShiftIndex];

    // # -------------------------------------------------------------
    // # A. QUALITY PILLAR EVALUATION (Workbook 6.11, Slide 52)
    // # Starts at 100%. Deduct for off-center target or rough touchdown.
    // # -------------------------------------------------------------
    // Dynamic target coordinates from current active payload
    let target = {
      radiusM: contract.targetRadiusM,
      angleDeg: contract.targetAngleDeg,
      heightM: contract.targetHeightM,
      toleranceRadiusM: 2.5
    };
    if (physics.hasLoad && window.CRANE_PHYSICS_CONFIG && window.CRANE_PHYSICS_CONFIG.LOADS) {
      const activeLoad = window.CRANE_PHYSICS_CONFIG.LOADS[physics.currentLoadIndex];
      if (activeLoad && activeLoad.target) {
        target = activeLoad.target;
      }
    }

    const radialErr = Math.abs(physics.trolleyRadiusM - target.radiusM);
    let angleErr = Math.abs(physics.slewAngleDeg - target.angleDeg);
    if (angleErr > 180) angleErr = 360 - angleErr;

    // Detect touchdown on target slab
    if (physics.hookElevationM <= target.heightM + 0.3 && radialErr <= target.toleranceRadiusM + 2.0) {
      if (!this.isLandingInitiated) {
        this.isLandingInitiated = true;
        // # Equation: Rough Touchdown Penalty: If vertical landing speed > 0.3 m/s, deduct points
        const landingSpeed = Math.abs(physics.hoistVelocityMs);
        if (landingSpeed > 0.30) {
          const roughLandingPenalty = Math.min(25, (landingSpeed - 0.30) * 80.0);
          this.deductQuality(roughLandingPenalty, `Rough Touchdown Speed: ${landingSpeed.toFixed(2)} m/s (>0.30m/s safe limit)`);
        }
      }
    }

    // # -------------------------------------------------------------
    // # B. SAFETY PILLAR EVALUATION
    // # Starts at 100%. Deductions for sway, exclusion zones, obstacle proximity, signaller breach.
    // # -------------------------------------------------------------

    // 1. Excessive Pendulum Sway: If total sway > maxPermissibleSwayDeg
    if (physics.totalSwayAngleDeg > contract.maxPermissibleSwayDeg) {
      const excessSway = physics.totalSwayAngleDeg - contract.maxPermissibleSwayDeg;
      const swayDeduction = excessSway * 1.8 * dt;
      this.deductSafety(swayDeduction, `Excessive Pendulum Sway: ${physics.totalSwayAngleDeg.toFixed(1)}° (> ${contract.maxPermissibleSwayDeg}° limit)`);
    }

    // 2. Strict Shift 2 Rule: Sway < 5.0 deg required before lowering near target
    if (contract.id === 'SHIFT_2_PLACING_BEAMS') {
      if (physics.hookElevationM < 16.0 && physics.hoistVelocityMs > 0 && physics.totalSwayAngleDeg > 5.0) {
        this.deductSafety(4.5 * dt, `Tenstar 2.3 Rule Breach: Lowering I-Beam while sway > 5.0° (${physics.totalSwayAngleDeg.toFixed(1)}°)`);
      }
    }

    // 3. Prohibited Red Exclusion Zone Violation
    if (physics.isInExclusionZone) {
      this.deductSafety(15.0 * dt, `Exclusion Zone Overfly Breach: ${physics.activeExclusionName}`);
    }

    // 4. Scaffolding Obstacle Collision or Near-Miss (< 1.2m clearance)
    this.evaluateObstacleClearance(physics, dt);

    // 5. Signaller Command Following (Shift 3 Blind Lift)
    if (contract.isBlindLift) {
      this.evaluateSignallerObedience(physics, dt);
    }

    // # -------------------------------------------------------------
    // # C. ECONOMY PILLAR EVALUATION
    // # Starts at 100%. Deductions for high jerkiness, direction hunting reversals, and time overruns.
    // # -------------------------------------------------------------

    // 1. Joystick Jerkiness (RPM & Hydraulic Shock)
    if (physics.isInputShockActive) {
      const jerkPenalty = (physics.filteredJerk - PHYSICS_CFG.JERK_THRESHOLD_SMOOTH) * 2.2 * dt;
      this.deductEconomy(jerkPenalty, `Hydraulic Shock / High Jerk Input: ${physics.filteredJerk.toFixed(1)} s⁻¹`);
    }

    // 2. Control Hunting / Unnecessary Reversals
    const currentTrolleySign = Math.sign(physics.currentInputVector.trolley);
    if (currentTrolleySign !== 0 && this.lastTrolleySign !== 0 && currentTrolleySign !== this.lastTrolleySign) {
      this.reversalCount++;
      this.deductEconomy(1.5, 'Trolley Direction Rapid Reversal (Hunting)');
    }
    this.lastTrolleySign = currentTrolleySign;

    const currentSlewSign = Math.sign(physics.currentInputVector.slew);
    if (currentSlewSign !== 0 && this.lastSlewSign !== 0 && currentSlewSign !== this.lastSlewSign) {
      this.reversalCount++;
      this.deductEconomy(1.5, 'Slew Azimuth Rapid Reversal (Hunting)');
    }
    this.lastSlewSign = currentSlewSign;

    // 3. Cycle Time Overrun Penalty
    if (this.shiftElapsedSec > contract.benchmarkTimeSec) {
      const timeOverrun = this.shiftElapsedSec - contract.benchmarkTimeSec;
      const timePenalty = 0.4 * dt;
      this.deductEconomy(timePenalty, `Benchmark Time Overrun (${timeOverrun.toFixed(0)}s excess)`);
    }

    // # -------------------------------------------------------------
    // # D. DYNAMIC SITE CRISIS EVALUATION (Pop-ups)
    // # -------------------------------------------------------------
    this.updateCrisisEngine(physics, dt);

    // # Update Live Pillar Gauges in DOM
    this.renderLivePillarsDOM();
  }

  // # Function: Evaluate Obstacle Clearance along elevation
  evaluateObstacleClearance(physics, dt) {
    PHYSICS_CFG.OBSTACLES.forEach((obs) => {
      if (obs.color !== '#10b981') { // Ignore landing slab itself
        const inRadiusRange = physics.trolleyRadiusM >= obs.minRM - 0.8 && physics.trolleyRadiusM <= obs.maxRM + 0.8;
        const belowObstacleTop = physics.hookElevationM <= obs.topHeightM + 0.6;
        if (inRadiusRange && belowObstacleTop) {
          this.deductSafety(12.0 * dt, `Proximity Hazard: Dangerous clearance with ${obs.name}`);
        }
      }
    });
  }

  // # Function: Evaluate Signaller Obedience during Shift 3 Blind Lift
  evaluateSignallerObedience(physics, dt) {
    const cmd = SIGNALLER_COMMANDS[this.currentSignallerCommandIndex];
    if (!cmd) return;

    if (cmd.isNeutralRequired) {
      // Operator must be in neutral 0 command
      const isMoving = Math.abs(physics.currentInputVector.slew) > 0.05 ||
                       Math.abs(physics.currentInputVector.trolley) > 0.05 ||
                       Math.abs(physics.currentInputVector.hoist) > 0.05;
      if (isMoving) {
        this.deductSafety(10.0 * dt, 'Signaller Protocol Breach: Moving during HOLD ALL command');
      }
    } else if (cmd.expectedAxis) {
      const actualVal = physics.currentInputVector[cmd.expectedAxis];
      // Check if moving in wrong direction
      if (actualVal !== 0 && Math.sign(actualVal) !== cmd.expectedSign) {
        this.deductSafety(8.0 * dt, `Signaller Protocol Breach: Contradictory motion to ${cmd.text}`);
      }
    }
  }

  // # Function: Deduct Quality score with zero floor clamp
  deductQuality(amount, reason) {
    this.qualityScore = Math.max(0.0, this.qualityScore - amount);
    if (!this.deductions.quality.includes(reason) && this.deductions.quality.length < 5) {
      this.deductions.quality.push(reason);
    }
  }

  // # Function: Deduct Safety score with zero floor clamp
  deductSafety(amount, reason) {
    this.safetyScore = Math.max(0.0, this.safetyScore - amount);
    if (!this.deductions.safety.includes(reason) && this.deductions.safety.length < 5) {
      this.deductions.safety.push(reason);
    }
  }

  // # Function: Deduct Economy score with zero floor clamp
  deductEconomy(amount, reason) {
    this.economyScore = Math.max(0.0, this.economyScore - amount);
    if (!this.deductions.economy.includes(reason) && this.deductions.economy.length < 5) {
      this.deductions.economy.push(reason);
    }
  }

  // # Function: Calculate Composite Tenstar Score & Virtual Safety Naira Payout
  // # Equation: Composite_Score = (Quality * 0.30) + (Safety * 0.50) + (Economy * 0.20)
  // # Equation: Safety_Naira_Payout = Contract_Base_Fee * (Composite_Score / 100) + Clean_Bonus
  calculateShiftResults() {
    const q = this.qualityScore;
    const s = this.safetyScore;
    const e = this.economyScore;

    // # Equation: 30% Quality, 50% Safety, 20% Economy composite ratio
    const compositeScore = parseFloat(((q * 0.30) + (s * 0.50) + (e * 0.20)).toFixed(1));

    const contract = TENSTAR_SHIFT_CONTRACTS[this.activeShiftIndex];
    let payoutNaira = Math.round(contract.contractFeeNaira * (compositeScore / 100.0));

    // Zero-incident clean bonus
    let cleanBonus = 0;
    if (s >= 95.0 && q >= 90.0) {
      cleanBonus = 500;
      payoutNaira += cleanBonus;
    }

    // Update Career Registers
    this.totalSafetyNaira += payoutNaira;
    this.completedShiftsCount += 1;
    this.isShiftActive = false;

    // Check rank promotion
    this.evaluateRankProgression();

    return {
      contractTitle: contract.title,
      exerciseCode: contract.exerciseCode,
      qualityScore: q.toFixed(1),
      safetyScore: s.toFixed(1),
      economyScore: e.toFixed(1),
      compositeScore,
      payoutNaira,
      cleanBonus,
      elapsedSec: Math.round(this.shiftElapsedSec),
      deductions: this.deductions
    };
  }

  // ========================================================================
  // # SECTION 3: DYNAMIC SITE CRISIS EVENTS (Workbook 6.8, 6.9, 6.10)
  // ========================================================================

  // # Function: Update Random Site Crisis Event Generator
  updateCrisisEngine(physics, dt) {
    const now = Date.now();

    // Rotate Signaller Command for Shift 3 every 8 seconds
    if (TENSTAR_SHIFT_CONTRACTS[this.activeShiftIndex].isBlindLift) {
      if (now - this.lastSignallerCommandTime > 8000) {
        this.lastSignallerCommandTime = now;
        this.currentSignallerCommandIndex = (this.currentSignallerCommandIndex + 1) % SIGNALLER_COMMANDS.length;
        this.renderSignallerBannerDOM();
      }
    }

    // Evaluate active crisis countdown
    if (this.activeCrisis) {
      this.crisisTimerSec -= dt;

      if (this.activeCrisis === 'RADIO_LOST') {
        this.crisisTimeLimitSec -= dt;
        // Check if operator brought all joysticks to neutral (0 command)
        const isNeutral =
          Math.abs(physics.currentInputVector.slew) < 0.05 &&
          Math.abs(physics.currentInputVector.trolley) < 0.05 &&
          Math.abs(physics.currentInputVector.hoist) < 0.05;

        if (isNeutral && !this.hasObeyedCrisisReaction) {
          this.hasObeyedCrisisReaction = true;
          this.renderCrisisAlertDOM('RADIO_RESTORED');
        } else if (this.crisisTimeLimitSec <= 0 && !this.hasObeyedCrisisReaction) {
          // # Critical Failure Penalty: -25 Safety Score deduction for failing to stop upon radio loss
          this.deductSafety(25.0, 'Radio Contact Lost Breach: Failed neutral stop within 3.0s window');
          this.activeCrisis = null;
          this.renderCrisisAlertDOM(null);
        }
      } else if (this.activeCrisis === 'WIND_GUST') {
        // Requires 50% speed reduction (input deflection <= 0.50)
        const maxInput = Math.max(
          Math.abs(physics.currentInputVector.slew),
          Math.abs(physics.currentInputVector.trolley),
          Math.abs(physics.currentInputVector.hoist)
        );
        if (maxInput > 0.50) {
          this.deductSafety(15.0 * dt, 'Wind Gust Speed Limit Violation: Operating > 50% speed during gale storm');
        }
      }

      if (this.crisisTimerSec <= 0) {
        this.activeCrisis = null;
        this.renderCrisisAlertDOM(null);
      }
      return;
    }

    // # Roll for random crisis spawn every 25 seconds of active shift
    if (now - this.lastCrisisRollTime > 25000 && this.shiftElapsedSec > 15.0) {
      this.lastCrisisRollTime = now;
      const roll = Math.random();

      if (roll < 0.35) {
        // Trigger Sudden Abuja Wind Gust (Workbook 6.9)
        this.triggerCrisisEvent('WIND_GUST');
      } else if (roll < 0.60) {
        // Trigger Signaller Radio Contact Lost (Workbook 6.14)
        this.triggerCrisisEvent('RADIO_LOST');
      }
    }
  }

  // # Function: Trigger Specific Crisis Event
  triggerCrisisEvent(type) {
    this.activeCrisis = type;
    this.hasObeyedCrisisReaction = false;

    if (type === 'WIND_GUST') {
      this.crisisTimerSec = 12.0; // 12 seconds wind gust
      this.renderCrisisAlertDOM('WIND_GUST');
    } else if (type === 'RADIO_LOST') {
      this.crisisTimerSec = 8.0;
      this.crisisTimeLimitSec = 3.0; // 3 seconds reaction window
      this.renderCrisisAlertDOM('RADIO_LOST');
      if (window.CraneLabApp && typeof window.CraneLabApp.soundHorn === 'function') {
        window.CraneLabApp.soundHorn();
      }
    }
  }

  // ========================================================================
  // # SECTION 4: EMBEDDED IOT TELEMETRY BRIDGE (ESP32 + MPU6050 SCHEMA)
  // ========================================================================

  // # Function: Synthesize Real-Time ESP32 + MPU6050 Microcontroller Hardware Telemetry Packet
  // # Schema: {"device_id": "ASVAM-CRANE-04", "mpu6050_pitch_deg": swayX, ...}
  generateIoTPacket(physics) {
    const timestampMs = Date.now();
    this.iotPacketSequence++;

    const phys = physics || window.CranePhysics || {
      pendulumRadialDeg: 0,
      pendulumTangentialDeg: 0,
      trolleyRadiusM: 24.5,
      slewAngleDeg: 0,
      hookElevationM: 18.2,
      isEmergencyStopped: false
    };

    // Calculate CRC-16 Checksum for hardware framing
    const pitch = parseFloat((phys.pendulumRadialDeg || 0).toFixed(2));
    const roll = parseFloat((phys.pendulumTangentialDeg || 0).toFixed(2));
    const loadKg = PHYSICS_CFG.HOOK_PAYLOAD_MASS_TONNES * 1000.0;
    const swlPct = parseFloat(((loadKg * 9.81 * (phys.trolleyRadiusM || 24.5)) / (1800.0 * 1000) * 100).toFixed(1));

    // # JSON Telemetry Packet Structure conforming to ASVAM Hardware Retro-Kit
    const packet = {
      device_id: 'ASVAM-CRANE-04',
      protocol_version: 'ASVAM-IoT-v1.4',
      timestamp_ms: timestampMs,
      packet_seq: this.iotPacketSequence,
      mpu6050: {
        pitch_deg: pitch,
        roll_deg: roll,
        accel_x_g: parseFloat((Math.sin((pitch * Math.PI) / 180)).toFixed(3)),
        accel_y_g: parseFloat((Math.sin((roll * Math.PI) / 180)).toFixed(3)),
        accel_z_g: 0.998,
        sway_vector_magnitude: parseFloat(Math.hypot(pitch, roll).toFixed(2))
      },
      load_cell: {
        payload_kg: loadKg,
        rated_capacity_kg: 6000.0,
        swl_utilization_pct: swlPct,
        overload_trip: swlPct > 95.0
      },
      plant_kinematics: {
        slew_azimuth_deg: parseFloat((phys.slewAngleDeg || 0).toFixed(1)),
        trolley_radius_m: parseFloat((phys.trolleyRadiusM || 0).toFixed(1)),
        hook_elevation_m: parseFloat((phys.hookElevationM || 0).toFixed(1)),
        wind_anemometer_ms: parseFloat((TENSTAR_SHIFT_CONTRACTS[this.activeShiftIndex].windSpeedMs).toFixed(1))
      },
      interlock_status: {
        hardware_heartbeat: true,
        estop_relay_closed: !phys.isEmergencyStopped,
        exclusion_breach: phys.isInExclusionZone || false,
        sli_warning_klaxon: swlPct > 75.0
      },
      crc16_checksum: this.computeCRC16(`${timestampMs}:${pitch}:${roll}:${loadKg}`)
    };

    this.latestIoTPacket = packet;
    return packet;
  }

  // # Function: CRC-16 (IBM/ANSI) Checksum Generator
  // # Equation: Polynomial 0x8005 over telemetry ASCII bytes
  computeCRC16(dataString) {
    let crc = 0xFFFF;
    for (let i = 0; i < dataString.length; i++) {
      crc ^= dataString.charCodeAt(i) << 8;
      for (let j = 0; j < 8; j++) {
        if ((crc & 0x8000) !== 0) {
          crc = ((crc << 1) ^ 0x1021) & 0xFFFF;
        } else {
          crc = (crc << 1) & 0xFFFF;
        }
      }
    }
    return '0x' + crc.toString(16).toUpperCase().padStart(4, '0');
  }

  // # Function: Continuous 10 Hz IoT Telemetry Stream Generator
  startIoTTelemetryStream() {
    if (this.tickerInterval) clearInterval(this.tickerInterval);

    // # 100ms interval = 10 Hz telemetry packet frequency (standard industrial CAN/UART)
    this.tickerInterval = setInterval(() => {
      if (this.isIoTStreamPaused) return;

      const packet = this.generateIoTPacket(window.CranePhysics);

      // Render into IoT Inspector Drawer if open
      if (this.isIoTDrawerOpen) {
        this.renderIoTInspectorContent(packet);
      }
    }, 100);
  }

  // ========================================================================
  // # SECTION 5: UI RENDERING (HUD, CRISIS BANNERS & IOT DRAWER)
  // ========================================================================

  // # Function: Render Career Progression & Active Contract in View C Header
  renderCareerHUD() {
    const rank = CAREER_RANKS[this.currentRankIndex];
    const contract = TENSTAR_SHIFT_CONTRACTS[this.activeShiftIndex];

    // Update Career Pill in Cockpit
    const rankTitleElem = document.getElementById('hud-career-rank');
    const nairaBalElem = document.getElementById('hud-career-naira');
    const contractTagElem = document.getElementById('hud-contract-title');

    if (rankTitleElem) rankTitleElem.textContent = `${rank.badge} ${rank.title}`;
    if (nairaBalElem) nairaBalElem.textContent = `₦${this.totalSafetyNaira}`;
    if (contractTagElem) contractTagElem.textContent = `${contract.exerciseCode}: ${contract.title}`;
  }

  // # Function: Render Real-Time Tenstar Scoring Pillar Gauges
  renderLivePillarsDOM() {
    const qElem = document.getElementById('pillar-quality-val');
    const sElem = document.getElementById('pillar-safety-val');
    const eElem = document.getElementById('pillar-economy-val');
    const compElem = document.getElementById('pillar-composite-val');

    if (qElem) qElem.textContent = `${this.qualityScore.toFixed(0)}%`;
    if (sElem) {
      sElem.textContent = `${this.safetyScore.toFixed(0)}%`;
      sElem.className = this.safetyScore < 70 ? 'gauge-val danger' : this.safetyScore < 85 ? 'gauge-val warn' : 'gauge-val safe';
    }
    if (eElem) eElem.textContent = `${this.economyScore.toFixed(0)}%`;

    if (compElem) {
      const comp = (this.qualityScore * 0.30) + (this.safetyScore * 0.50) + (this.economyScore * 0.20);
      compElem.textContent = `${comp.toFixed(1)}%`;
    }
  }

  // # Function: Render Signaller Blind Lift Visual Banner
  renderSignallerBannerDOM() {
    const banner = document.getElementById('signaller-hud-banner');
    if (!banner) return;

    const cmd = SIGNALLER_COMMANDS[this.currentSignallerCommandIndex];
    banner.innerHTML = `
      <div class="signaller-box">
        <span class="signaller-icon">${cmd.icon}</span>
        <div class="signaller-text">
          <span class="signaller-label">BANKSMAN RADIO (VHF CH 4):</span>
          <strong>${cmd.text}</strong>
        </div>
      </div>
    `;
  }

  // # Function: Render Dynamic Crisis Event Alert Banner
  renderCrisisAlertDOM(crisisType) {
    const container = document.getElementById('crisis-alert-container');
    if (!container) return;

    if (!crisisType) {
      container.innerHTML = '';
      container.style.display = 'none';
      return;
    }

    container.style.display = 'block';

    if (crisisType === 'WIND_GUST') {
      container.innerHTML = `
        <div class="crisis-banner wind-gust">
          <span class="crisis-icon">🌪️</span>
          <div class="crisis-body">
            <strong>CRISIS: SUDDEN ABUJA GUST (14.5 m/s)!</strong>
            <p>High-altitude wind velocity spike. Statutory LOLER Rule: Reduce all joystick travel by 50% immediately!</p>
          </div>
          <span class="crisis-timer">${this.crisisTimerSec.toFixed(0)}s</span>
        </div>
      `;
    } else if (crisisType === 'RADIO_LOST') {
      container.innerHTML = `
        <div class="crisis-banner radio-lost pulsating-red">
          <span class="crisis-icon">📻⚡</span>
          <div class="crisis-body">
            <strong>CRISIS: SIGNALLER RADIO CONTACT LOST!</strong>
            <p>Blind lift communications interrupted. Return all controls to neutral STOP within 3 seconds or trigger critical fail!</p>
          </div>
          <span class="crisis-timer countdown">${this.crisisTimeLimitSec.toFixed(1)}s</span>
        </div>
      `;
    } else if (crisisType === 'RADIO_RESTORED') {
      container.innerHTML = `
        <div class="crisis-banner radio-restored">
          <span class="crisis-icon">✅</span>
          <div class="crisis-body">
            <strong>RADIO CONTACT RESTORED - NEUTRAL VERIFIED</strong>
            <p>Banksman frequency clear. Resume lifting in accordance with standard hand signals.</p>
          </div>
        </div>
      `;
    }
  }

  // # Function: Inject Toggleable IoT Hardware Packet Inspector Drawer into DOM
  renderIoTDrawer() {
    let drawer = document.getElementById('iot-inspector-drawer');
    if (!drawer) {
      drawer = document.createElement('div');
      drawer.id = 'iot-inspector-drawer';
      drawer.className = 'iot-drawer collapsed';
      document.body.appendChild(drawer);
    }

    drawer.innerHTML = `
      <div class="iot-drawer-header" onclick="window.CareerTelemetry.toggleIoTDrawer()">
        <div class="iot-header-title">
          <span class="iot-led-dot active"></span>
          <strong>ESP32 + MPU6050 IoT Hardware Bridge</strong>
          <span class="iot-baud-badge">UART 115200 BAUD</span>
        </div>
        <button type="button" class="btn-drawer-toggle" id="btn-toggle-iot-drawer">▲ Open Inspector</button>
      </div>
      <div class="iot-drawer-body" id="iot-drawer-body">
        <div class="iot-controls-bar">
          <span style="font-size: 0.72rem; color: var(--text-secondary);">Packet Stream: <strong>10 Hz (JSON Frames)</strong></span>
          <div style="display: flex; gap: 0.4rem;">
            <button class="btn-aux btn-sm" onclick="window.CareerTelemetry.toggleIoTStreamPause()">
              <span id="btn-iot-pause-text">⏸️ Pause Stream</span>
            </button>
            <button class="btn-aux btn-sm" onclick="window.CareerTelemetry.copyCurrentIoTPacket()">
              📋 Copy JSON Packet
            </button>
          </div>
        </div>
        <pre class="iot-terminal-code" id="iot-terminal-view">Awaiting initial hardware packet...</pre>
      </div>
    `;
  }

  // # Function: Update Syntax-Highlighted JSON in IoT Inspector Terminal
  renderIoTInspectorContent(packet) {
    const view = document.getElementById('iot-terminal-view');
    if (!view) return;

    const jsonStr = JSON.stringify(packet, null, 2);
    view.textContent = jsonStr;
  }

  // # Function: Toggle Open/Collapsed State of IoT Hardware Drawer
  toggleIoTDrawer() {
    this.isIoTDrawerOpen = !this.isIoTDrawerOpen;
    const drawer = document.getElementById('iot-inspector-drawer');
    const toggleBtn = document.getElementById('btn-toggle-iot-drawer');

    if (drawer) {
      if (this.isIoTDrawerOpen) {
        drawer.classList.remove('collapsed');
        drawer.classList.add('expanded');
        if (toggleBtn) toggleBtn.textContent = '▼ Minimize';
      } else {
        drawer.classList.remove('expanded');
        drawer.classList.add('collapsed');
        if (toggleBtn) toggleBtn.textContent = '▲ Open Inspector';
      }
    }
  }

  // # Function: Toggle Pause/Resume on IoT Stream
  toggleIoTStreamPause() {
    this.isIoTStreamPaused = !this.isIoTStreamPaused;
    const btnText = document.getElementById('btn-iot-pause-text');
    if (btnText) {
      btnText.textContent = this.isIoTStreamPaused ? '▶️ Resume Stream' : '⏸️ Pause Stream';
    }
  }

  // # Function: Copy Current IoT JSON Packet to Clipboard
  async copyCurrentIoTPacket() {
    if (!this.latestIoTPacket) return;
    try {
      if (typeof navigator !== 'undefined' && navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
        await navigator.clipboard.writeText(JSON.stringify(this.latestIoTPacket, null, 2));
      }
      if (typeof alert === 'function') {
        alert('ESP32 IoT Hardware Telemetry Packet copied to clipboard!');
      }
    } catch (err) {
      if (typeof alert === 'function') {
        alert('Copied telemetry JSON to clipboard!');
      }
    }
  }
}

// # State Block: Instantiate Singleton Global Career Engine & Export Constants
window.CAREER_RANKS = CAREER_RANKS;
window.TENSTAR_SHIFT_CONTRACTS = TENSTAR_SHIFT_CONTRACTS;
window.SIGNALLER_COMMANDS = SIGNALLER_COMMANDS;
window.CareerTelemetry = new CareerTelemetryEngine();
