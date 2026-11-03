/**
 * CraneLab: ASVAM-Pulse - Dual-Joystick & Pendulum Sway Physics Engine
 * TETFund - Tenstar Simulator Training Initiative
 * Consortium: ASQ Development & Training UK / SAMMAX Global Services
 *
 * Curriculum Specifications:
 * - Workbook 6.11 & Day 3 Slide 52: Pendulum dynamics, Jerk calculations & Input Damping.
 * - ASVAM ISO Crane Joystick Mapping: Left (Slew/Trolley), Right (Hoist Z-axis only).
 * - Split-Screen HTML5 Canvas: 360° Slew Radar (Left) + Side-Elevation Height Gauge (Right).
 */

// # State Block: Physical Constants & Plant Machinery Parameters
const CRANE_PHYSICS_CONFIG = {
  GRAVITY: 9.81,                      // # Standard gravitational acceleration in m/s²
  JIB_LENGTH_MAX: 50.0,               // # Maximum working jib reach in meters
  TROLLEY_RADIUS_MIN: 4.0,            // # Minimum trolley inner limit buffer in meters
  TROLLEY_RADIUS_MAX: 48.0,           // # Maximum trolley outer limit buffer in meters
  CAB_MAST_HEIGHT: 32.0,              // # Tower crane jib apex height in meters
  HOOK_HEIGHT_MIN: 0.5,               // # Minimum hook ground clearance in meters
  HOOK_HEIGHT_MAX: 30.0,              // # Maximum hoist upper limit switch in meters
  MAX_SLEW_SPEED_DEG: 18.0,           // # Maximum slewing angular velocity in deg/s (0.314 rad/s)
  MAX_TROLLEY_SPEED_MS: 1.2,          // # Maximum trolley linear speed in m/s
  MAX_HOIST_SPEED_MS: 0.9,            // # Maximum hoist cable line speed in m/s
  HOOK_PAYLOAD_MASS_TONNES: 3.5,      // # Suspended concrete test bucket payload in metric tonnes
  RATED_MOMENT_KNM: 1800.0,           // # Safe Working Load (SWL) nominal rated moment in kNm
  PENDULUM_DAMPING_RATIO: 0.08,       // # Viscous aerodynamic & internal cable friction damping zeta
  JERK_THRESHOLD_SMOOTH: 1.8,         // # Maximum jerk for smooth feathering rating (1/s)
  JERK_THRESHOLD_SHOCK: 3.2,          // # Critical threshold triggering shock oscillation spike (1/s)

  // # State Block: 3rd-Floor Target Drop Zone Coordinates (Workbook Exercise)
  TARGET_ZONE: {
    name: '3rd Floor Target Landing Slab',
    radiusM: 28.0,                    // # Radial distance from mast center (m)
    angleDeg: 135.0,                  // # Azimuth compass bearing (Southeast)
    heightM: 12.0,                    // # Elevation of 3rd floor slab (m)
    toleranceRadiusM: 1.8,            // # Acceptable landing radial error tolerance
    toleranceAngleDeg: 4.0,           // # Acceptable landing azimuth angle tolerance
    toleranceHeightM: 0.8             // # Acceptable landing hook height tolerance
  },

  // # State Block: Prohibited Exclusion Zones (LOLER Overfly Restriction)
  EXCLUSION_ZONES: [
    {
      id: 'ZONE_SITE_OFFICE',
      label: 'EXCLUSION: SITE OFFICES & GENSET',
      startAngleDeg: 210.0,
      endAngleDeg: 255.0,
      minRadiusM: 8.0,
      maxRadiusM: 26.0
    },
    {
      id: 'ZONE_PUBLIC_HIGHWAY',
      label: 'EXCLUSION: PUBLIC DUAL CARRIAGEWAY',
      startAngleDeg: 310.0,
      endAngleDeg: 350.0,
      minRadiusM: 32.0,
      maxRadiusM: 50.0
    }
  ],

  // # State Block: Side Elevation Obstacles & Scaffolding Floors
  OBSTACLES: [
    { name: 'Ground Floor Logistics Bay', baseHeightM: 0.0, topHeightM: 1.0, minRM: 10.0, maxRM: 45.0, color: '#334155' },
    { name: 'Floor 1 Steel Scaffolding', baseHeightM: 1.0, topHeightM: 4.0, minRM: 16.0, maxRM: 24.0, color: '#475569' },
    { name: 'Floor 2 Brickwork Facade', baseHeightM: 4.0, topHeightM: 8.0, minRM: 16.0, maxRM: 24.0, color: '#64748b' },
    { name: 'Floor 3 Target Concrete Slab', baseHeightM: 8.0, topHeightM: 12.0, minRM: 25.0, maxRM: 31.0, color: '#10b981' }
  ]
};

// # Class: CranePhysicsEngine - Mechanical Kinematics, Dynamics & Canvas Render Engine
class CranePhysicsEngine {
  // # Function: Constructor initializing kinematics and ODE states
  constructor() {
    // # State Block: Kinematic Spatial Coordinates
    this.slewAngleDeg = 0.0;           // # Jib azimuth orientation theta in degrees [0, 360)
    this.trolleyRadiusM = 24.5;        // # Radial position R along working jib in meters [4, 48]
    this.hookElevationM = 18.2;        // # Hook elevation z above ground datum in meters [0.5, 30]
    this.cableLengthM = 13.8;          // # Suspended hoist wire rope length L = Cab_Height - z

    // # State Block: Dynamic Velocities and Accelerations
    this.slewVelocityDeg = 0.0;        // # Current slew angular rate dtheta/dt
    this.trolleyVelocityMs = 0.0;      // # Current trolley linear speed dR/dt
    this.hoistVelocityMs = 0.0;        // # Current hoist wire speed dz/dt

    this.prevTrolleyVelocity = 0.0;
    this.prevSlewVelocity = 0.0;
    this.trolleyAcceleration = 0.0;    // # Linear acceleration d²R/dt² for pendulum forcing
    this.slewAcceleration = 0.0;       // # Angular acceleration d²theta/dt² for tangential forcing

    // # State Block: Dual-Axis Pendulum Sway ODE State
    // # Equation: Radial Pendulum (Trolley Axis) & Tangential Pendulum (Slew Axis)
    this.pendulumRadialDeg = 0.0;      // # In-plane radial deflection phi_r (degrees)
    this.pendulumRadialVel = 0.0;      // # In-plane angular velocity dphi_r/dt (deg/s)
    this.pendulumTangentialDeg = 0.0;  // # Out-of-plane tangential deflection phi_t (degrees)
    this.pendulumTangentialVel = 0.0;  // # Out-of-plane angular velocity dphi_t/dt (deg/s)

    // # State Block: Combined Pendulum Sway Metric
    this.totalSwayAngleDeg = 0.0;      // # Vector hypotenuse: sqrt(phi_r² + phi_t²)
    this.peakSwayRecorded = 0.0;       // # Peak sway amplitude encountered during session

    // # State Block: Control Input Jerk & Damping Oscilloscope State
    this.currentInputVector = { slew: 0, trolley: 0, hoist: 0 };
    this.previousInputVector = { slew: 0, trolley: 0, hoist: 0 };
    this.instantaneousJerk = 0.0;      // # Jerk = |delta_u| / dt
    this.filteredJerk = 0.0;           // # Low-pass filtered jerk for smooth display
    this.isInputShockActive = false;   // # Flagged when jerk exceeds shock threshold
    this.jerkHistory = new Array(60).fill(0.0); // # Rolling 60-frame buffer for oscilloscope

    // # State Block: ASVAM Target & Exclusion Flags
    this.isOnTarget = false;
    this.isInExclusionZone = false;
    this.activeExclusionName = '';
    this.isEmergencyStopped = false;

    // # State Block: Input Device States (Touch + Keyboard)
    this.keyboardKeys = {};
    this.canvas = null;
    this.ctx = null;
    this.lastFrameTime = performance.now();
  }

  // # Function: Initialize Physics Subsystem and Bind Event Listeners
  init(canvasElement) {
    this.canvas = canvasElement;
    if (this.canvas) {
      this.ctx = this.canvas.getContext('2d');
    }

    // # State Block: Initialize Keyboard Input Listeners (WASD + Arrow Keys Fallback)
    this.setupKeyboardListeners();

    // # State Block: Reset Timestamp Clock
    this.lastFrameTime = performance.now();
    console.log('[CranePhysics] Dual-Joystick Mapping & Pendulum Sway Engine Initialized');
  }

  // ========================================================================
  // # SECTION 1: STRICT ASVAM JOYSTICK MAPPING (Touch + Keyboard Fallback)
  // ========================================================================

  // # Function: Bind Keyboard Fallback Listeners (WASD + Arrow Keys)
  setupKeyboardListeners() {
    if (typeof window === 'undefined' || typeof window.addEventListener !== 'function') {
      return;
    }

    window.addEventListener('keydown', (event) => {
      // # State Block: Ignore keyboard input if focus is inside an input/select field
      if (document.activeElement && ['INPUT', 'SELECT', 'TEXTAREA'].includes(document.activeElement.tagName)) {
        return;
      }
      this.keyboardKeys[event.code] = true;
      this.pollKeyboardInputs();
    });

    window.addEventListener('keyup', (event) => {
      this.keyboardKeys[event.code] = false;
      this.pollKeyboardInputs();
    });
  }

  // # Function: Map Keyboard Keys to ASVAM Dual-Joystick Coordinates
  // # Mapping Rule:
  // # Left Stick: KeyW/ArrowUp = Trolley Out (+Y), KeyS/ArrowDown = Trolley In (-Y),
  // #             KeyA/ArrowLeft = Slew Left (-X), KeyD/ArrowRight = Slew Right (+X).
  // # Right Stick: KeyI/PageDown = Hoist Lower (Forward Push +Y),
  // #              KeyK/PageUp = Hoist Raise (Back Pull -Y).
  // #              Right X is physically locked at 0.
  pollKeyboardInputs() {
    if (this.isEmergencyStopped) return;

    // # Left Joystick: X-Axis (Slew Left / Right)
    let leftX = 0;
    if (this.keyboardKeys['KeyA'] || this.keyboardKeys['ArrowLeft']) leftX -= 1.0;
    if (this.keyboardKeys['KeyD'] || this.keyboardKeys['ArrowRight']) leftX += 1.0;

    // # Left Joystick: Y-Axis (Trolley In / Out)
    let leftY = 0;
    if (this.keyboardKeys['KeyW']) leftY += 1.0; // # Forward: Trolley Out
    if (this.keyboardKeys['KeyS']) leftY -= 1.0; // # Backward: Trolley In

    // # Right Joystick: Z-Axis Hoist (Push Up = Hoist Lower, Pull Down = Hoist Raise)
    let rightY = 0;
    if (this.keyboardKeys['KeyI'] || this.keyboardKeys['PageDown']) rightY += 1.0; // # Push Up = Hoist Lower
    if (this.keyboardKeys['KeyK'] || this.keyboardKeys['PageUp']) rightY -= 1.0;   // # Pull Down = Hoist Raise

    // # State Block: Apply keyboard inputs to virtual control registers
    this.setLeftJoystick(leftX, leftY);
    this.setRightJoystick(0, rightY);

    // # Update UI Thumbsticks if keyboard is used
    this.updateKnobVisualsFromKeyboard(leftX, leftY, rightY);
  }

  // # Function: Synchronize Virtual Knob DOM positions when keyboard controls are active
  updateKnobVisualsFromKeyboard(leftX, leftY, rightY) {
    const leftKnob = document.getElementById('stick-knob-left');
    const rightKnob = document.getElementById('stick-knob-right');
    const maxOffset = 50;

    if (leftKnob) {
      leftKnob.style.transform = `translate(${leftX * maxOffset}px, ${-leftY * maxOffset}px)`;
    }
    if (rightKnob) {
      // # Right Joystick X is locked to 0px
      rightKnob.style.transform = `translate(0px, ${-rightY * maxOffset}px)`;
    }
  }

  // # Function: Left Joystick Input Handler (Slew Left/Right & Trolley In/Out)
  // # Arguments: normX [-1.0 .. +1.0], normY [-1.0 .. +1.0]
  setLeftJoystick(normX, normY) {
    if (this.isEmergencyStopped) {
      this.currentInputVector.slew = 0;
      this.currentInputVector.trolley = 0;
      return;
    }
    // # Move Left: Slew Left (negative angular rate), Move Right: Slew Right (positive)
    this.currentInputVector.slew = Math.max(-1.0, Math.min(1.0, normX));

    // # Push Up (Forward): Trolley Out (+Y), Pull Down (Back): Trolley In (-Y)
    this.currentInputVector.trolley = Math.max(-1.0, Math.min(1.0, normY));

    // # Update Cockpit Text Readouts
    const slewText = document.getElementById('readout-slew');
    const trolleyText = document.getElementById('readout-trolley');
    if (slewText) slewText.textContent = `${Math.round(this.currentInputVector.slew * 100)}%`;
    if (trolleyText) trolleyText.textContent = `${Math.round(this.currentInputVector.trolley * 100)}%`;
  }

  // # Function: Right Joystick Input Handler (Hoist Z-Axis ONLY)
  // # Physical Rule: Left/Right Axis is physically locked (outputs 0).
  // # Push Up (Forward): Hoist Lower (increases cable length L).
  // # Pull Down (Back): Hoist Raise (decreases cable length L).
  setRightJoystick(normX, normY) {
    if (this.isEmergencyStopped) {
      this.currentInputVector.hoist = 0;
      return;
    }
    // # Left/Right Axis: Physically locked to 0
    const lockedX = 0;

    // # Forward (+Y) = Hoist Lower, Back (-Y) = Hoist Raise
    this.currentInputVector.hoist = Math.max(-1.0, Math.min(1.0, normY));

    // # Update Cockpit Text Readouts
    const hoistText = document.getElementById('readout-hoist');
    const auxText = document.getElementById('readout-aux');
    if (hoistText) {
      const mode = this.currentInputVector.hoist > 0 ? 'LOWER' : this.currentInputVector.hoist < 0 ? 'RAISE' : 'HOLD';
      hoistText.textContent = `${mode} ${Math.abs(Math.round(this.currentInputVector.hoist * 100))}%`;
    }
    if (auxText) auxText.textContent = 'LOCKED (0%)';
  }

  // ========================================================================
  // # SECTION 2: PENDULUM SWAY & SMOOTH CONTROL DAMPING MATH
  // ========================================================================

  // # Function: Physics Simulation Step (Evaluated every frame with delta-time dt)
  update(dt) {
    if (dt <= 0 || dt > 0.15) dt = 0.016; // # Sanity clamp against tab switching lag

    // # -------------------------------------------------------------
    // # 1. Joystick Jerk Math (Workbook 6.11 & Day 3 Slide 52)
    // # Equation: jerk = |current_input - previous_input| / dt
    // # -------------------------------------------------------------
    const deltaSlew = this.currentInputVector.slew - this.previousInputVector.slew;
    const deltaTrolley = this.currentInputVector.trolley - this.previousInputVector.trolley;
    const deltaHoist = this.currentInputVector.hoist - this.previousInputVector.hoist;

    // # Equation: Euclidean norm of control input vector change divided by dt
    const deltaInputMagnitude = Math.hypot(deltaSlew, deltaTrolley, deltaHoist);
    this.instantaneousJerk = deltaInputMagnitude / dt;

    // # Low-pass filter for smooth oscilloscope visualization: alpha = 0.25
    this.filteredJerk = (this.filteredJerk * 0.75) + (this.instantaneousJerk * 0.25);

    // # Update rolling 60-frame buffer for oscilloscope
    this.jerkHistory.shift();
    this.jerkHistory.push(this.filteredJerk);

    // # Save state for next step
    this.previousInputVector = { ...this.currentInputVector };

    // # Evaluate Shock Loading Flag
    this.isInputShockActive = this.filteredJerk >= CRANE_PHYSICS_CONFIG.JERK_THRESHOLD_SHOCK;

    // # -------------------------------------------------------------
    // # 2. Kinematic Integration (Slew, Trolley, Hoist)
    // # -------------------------------------------------------------
    if (!this.isEmergencyStopped) {
      // # Slew Angle Integration: Theta(t + dt) = Theta(t) + (input_slew * MAX_SLEW_SPEED) * dt
      this.slewVelocityDeg = this.currentInputVector.slew * CRANE_PHYSICS_CONFIG.MAX_SLEW_SPEED_DEG;
      this.slewAngleDeg = (this.slewAngleDeg + this.slewVelocityDeg * dt + 360) % 360;

      // # Trolley Linear Integration: R(t + dt) = R(t) + (input_trolley * MAX_TROLLEY_SPEED) * dt
      this.trolleyVelocityMs = this.currentInputVector.trolley * CRANE_PHYSICS_CONFIG.MAX_TROLLEY_SPEED_MS;
      this.trolleyRadiusM = Math.max(
        CRANE_PHYSICS_CONFIG.TROLLEY_RADIUS_MIN,
        Math.min(CRANE_PHYSICS_CONFIG.TROLLEY_RADIUS_MAX, this.trolleyRadiusM + this.trolleyVelocityMs * dt)
      );

      // # Hoist Cable Integration:
      // # Push Up (input > 0) -> Hoist Lower (height decreases, cable length L increases)
      // # Pull Down (input < 0) -> Hoist Raise (height increases, cable length L decreases)
      this.hoistVelocityMs = -this.currentInputVector.hoist * CRANE_PHYSICS_CONFIG.MAX_HOIST_SPEED_MS;
      this.hookElevationM = Math.max(
        CRANE_PHYSICS_CONFIG.HOOK_HEIGHT_MIN,
        Math.min(CRANE_PHYSICS_CONFIG.HOOK_HEIGHT_MAX, this.hookElevationM + this.hoistVelocityMs * dt)
      );
    } else {
      this.slewVelocityDeg = 0;
      this.trolleyVelocityMs = 0;
      this.hoistVelocityMs = 0;
    }

    // # Suspended Cable Length: L = Cab_Apex - Hook_Height
    this.cableLengthM = Math.max(1.8, CRANE_PHYSICS_CONFIG.CAB_MAST_HEIGHT - this.hookElevationM);

    // # Calculate Linear Accelerations
    this.trolleyAcceleration = (this.trolleyVelocityMs - this.prevTrolleyVelocity) / dt;
    this.slewAcceleration = (this.slewVelocityDeg - this.prevSlewVelocity) / dt;
    this.prevTrolleyVelocity = this.trolleyVelocityMs;
    this.prevSlewVelocity = this.slewVelocityDeg;

    // # -------------------------------------------------------------
    // # 3. Second-Order Damped Pendulum Differential Equations
    // # Equation: d²phi/dt² + 2*zeta*omega_n*dphi/dt + (g/L)*sin(phi) = - (accel / L)
    // # -------------------------------------------------------------
    const g = CRANE_PHYSICS_CONFIG.GRAVITY;
    const L = this.cableLengthM;
    const omegaN = Math.sqrt(g / L); // # Pendulum Natural Circular Frequency (rad/s)
    const zeta = CRANE_PHYSICS_CONFIG.PENDULUM_DAMPING_RATIO;

    // # A. Radial Pendulum Sway (Forced by Trolley Acceleration d²R/dt²)
    // # If user jerks input, inject shock oscillation spike proportional to excess jerk
    let radialForcingAccel = this.trolleyAcceleration;
    if (this.isInputShockActive) {
      radialForcingAccel += (this.filteredJerk - CRANE_PHYSICS_CONFIG.JERK_THRESHOLD_SMOOTH) * 2.8;
    }

    const radialRad = (this.pendulumRadialDeg * Math.PI) / 180.0;
    const radialAngularAccel =
      -(g / L) * Math.sin(radialRad) -
      2 * zeta * omegaN * ((this.pendulumRadialVel * Math.PI) / 180.0) -
      (radialForcingAccel / L) * Math.cos(radialRad);

    this.pendulumRadialVel += (radialAngularAccel * 180.0 / Math.PI) * dt;
    this.pendulumRadialDeg += this.pendulumRadialVel * dt;

    // # B. Tangential Pendulum Sway (Forced by Slewing Tangential Acceleration a = R * alpha)
    const slewRadPerSecSq = (this.slewAcceleration * Math.PI) / 180.0;
    const tangentialLinearAccel = this.trolleyRadiusM * slewRadPerSecSq;

    const tangentialRad = (this.pendulumTangentialDeg * Math.PI) / 180.0;
    const tangentialAngularAccel =
      -(g / L) * Math.sin(tangentialRad) -
      2 * zeta * omegaN * ((this.pendulumTangentialVel * Math.PI) / 180.0) -
      (tangentialLinearAccel / L) * Math.cos(tangentialRad);

    this.pendulumTangentialVel += (tangentialAngularAccel * 180.0 / Math.PI) * dt;
    this.pendulumTangentialDeg += this.pendulumTangentialVel * dt;

    // # Total Sway Vector Magnitude (Hypotenuse)
    this.totalSwayAngleDeg = Math.hypot(this.pendulumRadialDeg, this.pendulumTangentialDeg);
    if (this.totalSwayAngleDeg > this.peakSwayRecorded) {
      this.peakSwayRecorded = this.totalSwayAngleDeg;
    }

    // # -------------------------------------------------------------
    // # 4. Safe Working Load (SWL) Moment Calculation
    // # Equation: M = Force * Radius = (mass * 9.81) * Radius (kNm)
    // # -------------------------------------------------------------
    const loadForceKn = CRANE_PHYSICS_CONFIG.HOOK_PAYLOAD_MASS_TONNES * g;
    const currentMomentKnm = loadForceKn * this.trolleyRadiusM;
    const swlPercent = (currentMomentKnm / CRANE_PHYSICS_CONFIG.RATED_MOMENT_KNM) * 100;

    // # -------------------------------------------------------------
    // # 5. Evaluate Target Zone & Exclusion Zone Proximity
    // # -------------------------------------------------------------
    this.evaluateZoneProximity();

    // # -------------------------------------------------------------
    // # 6. Synchronize DOM Telemetry HUD Elements
    // # -------------------------------------------------------------
    this.updateDomHUD(swlPercent, currentMomentKnm);
  }

  // # Function: Evaluate Target Landing Drop Zone & Exclusion Zone Violations
  evaluateZoneProximity() {
    const tz = CRANE_PHYSICS_CONFIG.TARGET_ZONE;

    // # Check Target Radial and Height Error
    const radialError = Math.abs(this.trolleyRadiusM - tz.radiusM);
    const heightError = Math.abs(this.hookElevationM - tz.heightM);

    // # Check Angular Error with modular wrap-around
    let angleDiff = Math.abs(this.slewAngleDeg - tz.angleDeg);
    if (angleDiff > 180) angleDiff = 360 - angleDiff;

    // # Condition: All coordinates within tolerance bounds and sway stabilized < 2.0 deg
    this.isOnTarget =
      radialError <= tz.toleranceRadiusM &&
      angleDiff <= tz.toleranceAngleDeg &&
      heightError <= tz.toleranceHeightM &&
      this.totalSwayAngleDeg < 2.5;

    // # Check Prohibited Exclusion Zones
    this.isInExclusionZone = false;
    this.activeExclusionName = '';

    for (const zone of CRANE_PHYSICS_CONFIG.EXCLUSION_ZONES) {
      const inRadius = this.trolleyRadiusM >= zone.minRadiusM && this.trolleyRadiusM <= zone.maxRadiusM;
      let inAngle = false;
      if (zone.startAngleDeg <= zone.endAngleDeg) {
        inAngle = this.slewAngleDeg >= zone.startAngleDeg && this.slewAngleDeg <= zone.endAngleDeg;
      } else {
        // Crosses 360° north boundary
        inAngle = this.slewAngleDeg >= zone.startAngleDeg || this.slewAngleDeg <= zone.endAngleDeg;
      }

      if (inRadius && inAngle) {
        this.isInExclusionZone = true;
        this.activeExclusionName = zone.label;
        break;
      }
    }
  }

  // # Function: Synchronize View C HUD Elements
  updateDomHUD(swlPercent, momentKnm) {
    const slewVal = document.getElementById('hud-slew-val');
    const radiusVal = document.getElementById('hud-radius-val');
    const heightVal = document.getElementById('hud-height-val');
    const momentVal = document.getElementById('hud-moment-val');
    const swlVal = document.getElementById('hud-swl-val');
    const pendulumTag = document.getElementById('hud-pendulum-tag');
    const dropStatusTag = document.getElementById('hud-drop-status');

    if (slewVal) slewVal.textContent = `${this.slewAngleDeg.toFixed(1)}°`;
    if (radiusVal) radiusVal.textContent = `${this.trolleyRadiusM.toFixed(1)}`;
    if (heightVal) heightVal.textContent = `${this.hookElevationM.toFixed(1)}`;
    if (momentVal) momentVal.textContent = `${momentKnm.toFixed(1)}`;

    if (swlVal) {
      swlVal.textContent = `${swlPercent.toFixed(1)}%`;
      if (swlPercent > 90) swlVal.className = 'gauge-val danger';
      else if (swlPercent > 75) swlVal.className = 'gauge-val warn';
      else swlVal.className = 'gauge-val safe';
    }

    if (pendulumTag) {
      const swayStatus = this.isInputShockActive
        ? '⚠️ SHOCK JERK SPIKE'
        : this.totalSwayAngleDeg < 1.5
        ? 'DAMPED & STABLE ✓'
        : 'OSCILLATING';
      pendulumTag.textContent = `PENDULUM SWAY: ${this.totalSwayAngleDeg.toFixed(1)}° (${swayStatus})`;
      pendulumTag.style.color = this.isInputShockActive ? 'var(--safety-red)' : 'var(--safety-amber)';
    }

    if (dropStatusTag) {
      if (this.isInExclusionZone) {
        dropStatusTag.textContent = `⚠️ VIOLATION: ${this.activeExclusionName}`;
        dropStatusTag.style.color = 'var(--safety-red)';
        dropStatusTag.style.borderColor = 'var(--safety-red)';
      } else if (this.isOnTarget) {
        dropStatusTag.textContent = '🎯 TARGET 3RD-FLOOR SLAB REACHED (STABILIZED)';
        dropStatusTag.style.color = 'var(--safety-emerald)';
        dropStatusTag.style.borderColor = 'var(--safety-emerald)';
      } else {
        const dist = Math.abs(this.trolleyRadiusM - CRANE_PHYSICS_CONFIG.TARGET_ZONE.radiusM).toFixed(1);
        dropStatusTag.textContent = `TARGET APPROACH: ${dist}m RADIAL OFFSET`;
        dropStatusTag.style.color = 'var(--safety-amber)';
        dropStatusTag.style.borderColor = 'rgba(245, 158, 11, 0.4)';
      }
    }
  }

  // ========================================================================
  // # SECTION 3: SPLIT-SCREEN HTML5 CANVAS RENDERER
  // ========================================================================

  // # Function: Master Render Loop Partitioning Canvas into Left/Right Halves
  render() {
    if (!this.canvas || !this.ctx) return;
    const ctx = this.ctx;
    const w = this.canvas.width;
    const h = this.canvas.height;

    // # Clear whole frame
    ctx.clearRect(0, 0, w, h);

    // # Partition Dimensions: Left half (Radar), Right half (Side Elevation)
    const halfW = w / 2;

    // # Render Left Half: 360-Degree Top-Down Slew Radar
    ctx.save();
    ctx.beginPath();
    ctx.rect(0, 0, halfW, h);
    ctx.clip();
    this.renderTopDownRadar(ctx, 0, 0, halfW, h);
    ctx.restore();

    // # Render Right Half: Side-Elevation Height Gauge
    ctx.save();
    ctx.beginPath();
    ctx.rect(halfW, 0, halfW, h);
    ctx.clip();
    this.renderSideElevation(ctx, halfW, 0, halfW, h);
    ctx.restore();

    // # Render Central Split-Screen Seam & Hazard Divider
    ctx.strokeStyle = '#f59e0b';
    ctx.lineWidth = 2;
    ctx.setLineDash([8, 6]);
    ctx.beginPath();
    ctx.moveTo(halfW, 0);
    ctx.lineTo(halfW, h);
    ctx.stroke();
    ctx.setLineDash([]); // Reset dash

    // # Render Floating Control Input Damping Oscilloscope (Bottom Deck)
    this.renderOscilloscope(ctx, 16, h - 54, w - 32, 44);
  }

  // # Function: Render Left Half - 360-Degree Slew Radar
  renderTopDownRadar(ctx, x, y, width, height) {
    // # Background Fill
    ctx.fillStyle = '#070d1e';
    ctx.fillRect(x, y, width, height);

    // # Radar Center Origin (Mast Location)
    const centerX = x + width / 2;
    const centerY = y + height / 2 - 16;
    const radarRadius = Math.min(width / 2 - 36, height / 2 - 48);

    // # Radar Outer Degree Scale Ring
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(centerX, centerY, radarRadius, 0, Math.PI * 2);
    ctx.stroke();

    // # Radar Concentric Distance Range Rings (10m, 20m, 30m, 40m, 50m)
    const ranges = [10, 20, 30, 40, 50];
    ctx.font = '10px monospace';
    ctx.fillStyle = '#64748b';
    ranges.forEach((r) => {
      const ringPx = (r / CRANE_PHYSICS_CONFIG.JIB_LENGTH_MAX) * radarRadius;
      ctx.strokeStyle = 'rgba(51, 65, 85, 0.45)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(centerX, centerY, ringPx, 0, Math.PI * 2);
      ctx.stroke();
      ctx.fillText(`${r}m`, centerX + 4, centerY - ringPx + 11);
    });

    // # Compass Crosshairs (North, South, East, West)
    ctx.strokeStyle = 'rgba(71, 85, 105, 0.4)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(centerX - radarRadius, centerY);
    ctx.lineTo(centerX + radarRadius, centerY);
    ctx.moveTo(centerX, centerY - radarRadius);
    ctx.lineTo(centerX, centerY + radarRadius);
    ctx.stroke();

    // # Compass Labels
    ctx.fillStyle = '#f59e0b';
    ctx.font = 'bold 11px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('0° NORTH', centerX, centerY - radarRadius - 8);
    ctx.fillText('180° S', centerX, centerY + radarRadius + 14);
    ctx.fillText('90° E', centerX + radarRadius + 18, centerY + 4);
    ctx.fillText('270° W', centerX - radarRadius - 18, centerY + 4);

    // # Draw Prohibited Exclusion Zones (Red Hatched Sectors)
    CRANE_PHYSICS_CONFIG.EXCLUSION_ZONES.forEach((zone) => {
      const startRad = ((zone.startAngleDeg - 90) * Math.PI) / 180;
      const endRad = ((zone.endAngleDeg - 90) * Math.PI) / 180;
      const innerPx = (zone.minRadiusM / CRANE_PHYSICS_CONFIG.JIB_LENGTH_MAX) * radarRadius;
      const outerPx = (zone.maxRadiusM / CRANE_PHYSICS_CONFIG.JIB_LENGTH_MAX) * radarRadius;

      ctx.fillStyle = 'rgba(239, 68, 68, 0.2)';
      ctx.strokeStyle = '#ef4444';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(centerX, centerY, outerPx, startRad, endRad);
      ctx.arc(centerX, centerY, innerPx, endRad, startRad, true);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Zone label at mid-angle
      const midRad = (startRad + endRad) / 2;
      const labelPx = (innerPx + outerPx) / 2;
      ctx.fillStyle = '#fca5a5';
      ctx.font = '9px monospace';
      ctx.fillText(zone.label.split(':')[0], centerX + Math.cos(midRad) * labelPx, centerY + Math.sin(midRad) * labelPx);
    });

    // # Draw 3rd-Floor Target Landing Zone Bullseye
    const tz = CRANE_PHYSICS_CONFIG.TARGET_ZONE;
    const targetRad = ((tz.angleDeg - 90) * Math.PI) / 180;
    const targetDistPx = (tz.radiusM / CRANE_PHYSICS_CONFIG.JIB_LENGTH_MAX) * radarRadius;
    const targetX = centerX + Math.cos(targetRad) * targetDistPx;
    const targetY = centerY + Math.sin(targetRad) * targetDistPx;
    const targetTolPx = (tz.toleranceRadiusM / CRANE_PHYSICS_CONFIG.JIB_LENGTH_MAX) * radarRadius * 2;

    ctx.fillStyle = this.isOnTarget ? 'rgba(16, 185, 129, 0.4)' : 'rgba(16, 185, 129, 0.15)';
    ctx.strokeStyle = '#10b981';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(targetX, targetY, Math.max(12, targetTolPx), 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Inner Bullseye Dot
    ctx.fillStyle = '#10b981';
    ctx.beginPath();
    ctx.arc(targetX, targetY, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.font = '9px monospace';
    ctx.fillText('3RD-FL TARGET', targetX, targetY - 14);

    // # Rotating Jib & Counter-Jib Structure
    // # Math: 0 deg = North (-Y on screen) -> Radian = (slewAngleDeg - 90) * PI / 180
    const slewRad = ((this.slewAngleDeg - 90) * Math.PI) / 180;
    const counterSlewRad = slewRad + Math.PI;

    // Working Jib Beam Line (Right)
    const jibTipX = centerX + Math.cos(slewRad) * radarRadius;
    const jibTipY = centerY + Math.sin(slewRad) * radarRadius;
    ctx.strokeStyle = '#f59e0b';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(centerX, centerY);
    ctx.lineTo(jibTipX, jibTipY);
    ctx.stroke();

    // Counter-Jib Beam Line (Left) with Ballast
    const counterJibPx = (15.0 / CRANE_PHYSICS_CONFIG.JIB_LENGTH_MAX) * radarRadius;
    const counterTipX = centerX + Math.cos(counterSlewRad) * counterJibPx;
    const counterTipY = centerY + Math.sin(counterSlewRad) * counterJibPx;
    ctx.strokeStyle = '#94a3b8';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(centerX, centerY);
    ctx.lineTo(counterTipX, counterTipY);
    ctx.stroke();

    // Counterweight Rect
    ctx.fillStyle = '#475569';
    ctx.fillRect(counterTipX - 6, counterTipY - 6, 12, 12);

    // Mast Center Pivot Hub
    ctx.fillStyle = '#1e293b';
    ctx.strokeStyle = '#f59e0b';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(centerX, centerY, 8, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // # Trolley Position along Jib
    const trolleyDistPx = (this.trolleyRadiusM / CRANE_PHYSICS_CONFIG.JIB_LENGTH_MAX) * radarRadius;
    const trolleyX = centerX + Math.cos(slewRad) * trolleyDistPx;
    const trolleyY = centerY + Math.sin(slewRad) * trolleyDistPx;

    // Draw Trolley Carriage
    ctx.fillStyle = '#38bdf8';
    ctx.strokeStyle = '#0284c7';
    ctx.lineWidth = 2;
    ctx.fillRect(trolleyX - 5, trolleyY - 5, 10, 10);
    ctx.strokeRect(trolleyX - 5, trolleyY - 5, 10, 10);

    // # Suspended Load Position with Pendulum Sway Vector
    // # Radial sway shifts along jib line; Tangential sway shifts perpendicular to jib
    const perpSlewRad = slewRad + Math.PI / 2;
    const swingScale = 1.2; // Visual amplification of swing on radar
    const loadX = trolleyX + (Math.cos(slewRad) * this.pendulumRadialDeg * swingScale) +
                           (Math.cos(perpSlewRad) * this.pendulumTangentialDeg * swingScale);
    const loadY = trolleyY + (Math.sin(slewRad) * this.pendulumRadialDeg * swingScale) +
                           (Math.sin(perpSlewRad) * this.pendulumTangentialDeg * swingScale);

    // Hook Cable Tether (Trolley to Load)
    ctx.strokeStyle = 'rgba(245, 158, 11, 0.6)';
    ctx.lineWidth = 1.5;
    ctx.setLineDash([3, 2]);
    ctx.beginPath();
    ctx.moveTo(trolleyX, trolleyY);
    ctx.lineTo(loadX, loadY);
    ctx.stroke();
    ctx.setLineDash([]);

    // Suspended Load Circle
    ctx.fillStyle = this.isInputShockActive ? '#ef4444' : '#f59e0b';
    ctx.beginPath();
    ctx.arc(loadX, loadY, 6, 0, Math.PI * 2);
    ctx.fill();

    // Panel Header Badge
    ctx.textAlign = 'left';
    ctx.fillStyle = '#f8fafc';
    ctx.font = 'bold 11px system-ui';
    ctx.fillText('360° SLEW RADAR & DROP ZONE', x + 16, y + 22);
    ctx.fillStyle = '#94a3b8';
    ctx.font = '10px monospace';
    ctx.fillText(`BEARING: ${this.slewAngleDeg.toFixed(1)}° | RADIUS: ${this.trolleyRadiusM.toFixed(1)}m`, x + 16, y + 36);
  }

  // # Function: Render Right Half - Side-Elevation Height Gauge
  renderSideElevation(ctx, x, y, width, height) {
    // # Background Fill
    ctx.fillStyle = '#050914';
    ctx.fillRect(x, y, width, height);

    // # Elevation Scaling & Floor Datum Coordinates
    const marginL = 55;
    const marginB = 75;
    const groundY = y + height - marginB;
    const maxPlotHeight = height - marginB - 55;
    const apexHeightM = 35.0; // Scale top height

    // # Function: Convert elevation in meters to Canvas Y Coordinate
    // # Equation: py = groundY - (meters / apexHeightM) * maxPlotHeight
    const meterToY = (meters) => groundY - (meters / apexHeightM) * maxPlotHeight;

    // # Vertical Elevation Ruler Axis
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(x + marginL, y + 40);
    ctx.lineTo(x + marginL, groundY);
    ctx.stroke();

    // # Tick Marks (0m, 4m, 8m, 12m, 16m, 20m, 24m, 28m, 32m)
    ctx.font = '9px monospace';
    ctx.fillStyle = '#94a3b8';
    ctx.textAlign = 'right';
    for (let m = 0; m <= apexHeightM; m += 4) {
      const tickY = meterToY(m);
      ctx.beginPath();
      ctx.moveTo(x + marginL - 4, tickY);
      ctx.lineTo(x + marginL, tickY);
      ctx.stroke();
      ctx.fillText(`${m}m`, x + marginL - 6, tickY + 3);
    }

    // # Ground Line (0m)
    ctx.strokeStyle = '#f59e0b';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(x + marginL, groundY);
    ctx.lineTo(x + width - 16, groundY);
    ctx.stroke();

    ctx.fillStyle = '#1e293b';
    ctx.fillRect(x + marginL, groundY, width - marginL - 16, marginB);

    // # Draw Scaffolding Obstacles (Floor 1: 4m, Floor 2: 8m, Target Slab: 12m)
    const scaleX = (r) => x + marginL + ((r - 4.0) / 44.0) * (width - marginL - 50);

    CRANE_PHYSICS_CONFIG.OBSTACLES.forEach((obs) => {
      const obsY = meterToY(obs.topHeightM);
      const obsBaseY = meterToY(obs.baseHeightM);
      const obsHeightPx = obsBaseY - obsY;
      const obsStartX = scaleX(obs.minRM);
      const obsWidthPx = scaleX(obs.maxRM) - obsStartX;

      ctx.fillStyle = obs.color === '#10b981' ? 'rgba(16, 185, 129, 0.25)' : 'rgba(51, 65, 85, 0.45)';
      ctx.strokeStyle = obs.color;
      ctx.lineWidth = 1.5;
      ctx.fillRect(obsStartX, obsY, obsWidthPx, obsHeightPx);
      ctx.strokeRect(obsStartX, obsY, obsWidthPx, obsHeightPx);

      // Label
      ctx.fillStyle = obs.color;
      ctx.font = '8px monospace';
      ctx.textAlign = 'left';
      ctx.fillText(obs.name, obsStartX + 4, obsY + 12);
    });

    // # Tower Mast Vertical Lattice (Left side of elevation view)
    const mastX = x + marginL + 18;
    const mastW = 20;
    const cabY = meterToY(CRANE_PHYSICS_CONFIG.CAB_MAST_HEIGHT);

    ctx.fillStyle = '#0f172a';
    ctx.strokeStyle = '#475569';
    ctx.lineWidth = 2;
    ctx.fillRect(mastX, cabY, mastW, groundY - cabY);
    ctx.strokeRect(mastX, cabY, mastW, groundY - cabY);

    // Lattice Diagonals
    ctx.strokeStyle = '#f59e0b';
    ctx.lineWidth = 1;
    for (let my = cabY; my < groundY; my += 22) {
      ctx.beginPath();
      ctx.moveTo(mastX, my);
      ctx.lineTo(mastX + mastW, my + 22);
      ctx.moveTo(mastX + mastW, my);
      ctx.lineTo(mastX, my + 22);
      ctx.stroke();
    }

    // Working Jib Horizontal Beam at Apex
    const jibStartX = mastX + mastW;
    const jibEndX = x + width - 24;
    ctx.strokeStyle = '#f59e0b';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(jibStartX, cabY);
    ctx.lineTo(jibEndX, cabY);
    ctx.stroke();

    // # Trolley Position
    const trolleyElevationX = scaleX(this.trolleyRadiusM);
    const trolleyElevationY = cabY;

    // Draw Trolley Carriage
    ctx.fillStyle = '#38bdf8';
    ctx.fillRect(trolleyElevationX - 8, trolleyElevationY - 5, 16, 10);

    // # Hook Elevation & Pendulum Angular Deflection
    const hookRestY = meterToY(this.hookElevationM);
    const cablePixelLength = hookRestY - trolleyElevationY;

    // Pendulum angular deflection phi_r (in plane of radius)
    const phiRad = (this.pendulumRadialDeg * Math.PI) / 180.0;
    const hookX = trolleyElevationX + cablePixelLength * Math.sin(phiRad);
    const hookY = trolleyElevationY + cablePixelLength * Math.cos(phiRad);

    // Hoist Cable Wire Rope
    ctx.strokeStyle = '#e2e8f0';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(trolleyElevationX, trolleyElevationY + 5);
    ctx.lineTo(hookX, hookY);
    ctx.stroke();

    // Hook Pulley Block & Heavy Payload Box
    ctx.fillStyle = '#f59e0b';
    ctx.beginPath();
    ctx.arc(hookX, hookY, 5, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = this.isInputShockActive ? '#ef4444' : '#0284c7';
    ctx.strokeStyle = this.isInputShockActive ? '#fca5a5' : '#38bdf8';
    ctx.lineWidth = 1.5;
    ctx.fillRect(hookX - 10, hookY + 5, 20, 16);
    ctx.strokeRect(hookX - 10, hookY + 5, 20, 16);

    // # Visual Pendulum Angle Arc Indicator
    if (Math.abs(this.pendulumRadialDeg) > 0.5) {
      ctx.strokeStyle = 'rgba(245, 158, 11, 0.7)';
      ctx.lineWidth = 1.5;
      ctx.setLineDash([2, 2]);
      ctx.beginPath();
      ctx.arc(trolleyElevationX, trolleyElevationY, 32, Math.PI / 2, Math.PI / 2 + phiRad, phiRad < 0);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = '#f59e0b';
      ctx.font = '9px monospace';
      ctx.fillText(`${this.pendulumRadialDeg.toFixed(1)}°`, trolleyElevationX + (phiRad > 0 ? 38 : -38), trolleyElevationY + 36);
    }

    // Panel Header Badge
    ctx.textAlign = 'left';
    ctx.fillStyle = '#f8fafc';
    ctx.font = 'bold 11px system-ui';
    ctx.fillText('SIDE-ELEVATION HEIGHT GAUGE', x + 16, y + 22);
    ctx.fillStyle = '#94a3b8';
    ctx.font = '10px monospace';
    ctx.fillText(`HOOK HEIGHT: ${this.hookElevationM.toFixed(1)}m | CABLE L: ${this.cableLengthM.toFixed(1)}m`, x + 16, y + 36);
  }

  // # Function: Render Live Control Input Damping Oscilloscope
  renderOscilloscope(ctx, x, y, width, height) {
    // Oscilloscope Card Background
    ctx.fillStyle = 'rgba(11, 17, 32, 0.92)';
    ctx.strokeStyle = this.isInputShockActive ? '#ef4444' : '#334155';
    ctx.lineWidth = 1.5;
    ctx.fillRect(x, y, width, height);
    ctx.strokeRect(x, y, width, height);

    // Oscilloscope Title & Status
    const isSmooth = this.filteredJerk < CRANE_PHYSICS_CONFIG.JERK_THRESHOLD_SMOOTH;
    ctx.font = 'bold 9px monospace';
    ctx.fillStyle = isSmooth ? '#10b981' : this.isInputShockActive ? '#ef4444' : '#f59e0b';
    ctx.textAlign = 'left';
    const statusText = isSmooth
      ? 'CONTROL DAMPING: SMOOTH FEATHERING (ASVAM EXCELLENT)'
      : this.isInputShockActive
      ? 'CONTROL DAMPING: ABRUPT SHOCK LOAD WARNING!'
      : 'CONTROL DAMPING: MODERATE TRANSITION';
    ctx.fillText(statusText, x + 10, y + 14);

    ctx.textAlign = 'right';
    ctx.fillText(`JERK: ${this.filteredJerk.toFixed(2)} s⁻¹`, x + width - 10, y + 14);

    // Oscilloscope Rolling Waveform
    const waveX = x + 10;
    const waveY = y + 20;
    const waveW = width - 20;
    const waveH = height - 24;

    ctx.strokeStyle = 'rgba(51, 65, 85, 0.5)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(waveX, waveY + waveH);
    ctx.lineTo(waveX + waveW, waveY + waveH);
    ctx.stroke();

    // Waveform Curve
    ctx.strokeStyle = isSmooth ? '#10b981' : this.isInputShockActive ? '#ef4444' : '#f59e0b';
    ctx.lineWidth = 2;
    ctx.beginPath();

    const stepX = waveW / (this.jerkHistory.length - 1);
    this.jerkHistory.forEach((val, idx) => {
      // Scale jerk: 0 to 5.0 mapped to waveH
      const normalizedY = Math.min(1.0, val / 5.0);
      const px = waveX + idx * stepX;
      const py = waveY + waveH - normalizedY * (waveH - 4);
      if (idx === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    });
    ctx.stroke();
  }

  // # Function: Trigger Emergency Stop from Cockpit
  triggerEmergencyStop() {
    this.isEmergencyStopped = !this.isEmergencyStopped;
    if (this.isEmergencyStopped) {
      this.currentInputVector = { slew: 0, trolley: 0, hoist: 0 };
      this.slewVelocityDeg = 0;
      this.trolleyVelocityMs = 0;
      this.hoistVelocityMs = 0;
    }
    return this.isEmergencyStopped;
  }

  // # Function: Reset Kinematics to Initial Datum
  resetPositions() {
    this.slewAngleDeg = 0.0;
    this.trolleyRadiusM = 24.5;
    this.hookElevationM = 18.2;
    this.cableLengthM = 13.8;
    this.pendulumRadialDeg = 0.0;
    this.pendulumRadialVel = 0.0;
    this.pendulumTangentialDeg = 0.0;
    this.pendulumTangentialVel = 0.0;
    this.totalSwayAngleDeg = 0.0;
    this.filteredJerk = 0.0;
    this.isEmergencyStopped = false;
  }
}

// # State Block: Instantiate Singleton Global Physics Engine Instance & Export Configuration
if (typeof window !== 'undefined') {
  window.CRANE_PHYSICS_CONFIG = CRANE_PHYSICS_CONFIG;
  window.CranePhysics = new CranePhysicsEngine();
}
