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
  CAB_MAST_HEIGHT: 36.0,              // # Tower crane mast apex height in meters (upgraded for 6-story building clearance)
  HOOK_HEIGHT_MIN: 0.5,               // # Minimum hook ground clearance in meters
  HOOK_HEIGHT_MAX: 34.0,              // # Maximum hoist upper limit switch in meters
  MAX_SLEW_SPEED_DEG: 18.0,           // # Maximum slewing angular velocity in deg/s (0.314 rad/s)
  MAX_TROLLEY_SPEED_MS: 1.2,          // # Maximum trolley linear speed in m/s
  MAX_HOIST_SPEED_MS: 0.9,            // # Maximum hoist cable line speed in m/s
  HOOK_PAYLOAD_MASS_TONNES: 3.5,      // # Legacy default payload mass
  RATED_MOMENT_KNM: 1800.0,           // # Safe Working Load (SWL) nominal rated moment in kNm
  PENDULUM_DAMPING_RATIO: 0.08,       // # Viscous aerodynamic & internal cable friction damping zeta
  JERK_THRESHOLD_SMOOTH: 1.8,         // # Maximum jerk for smooth feathering rating (1/s)
  JERK_THRESHOLD_SHOCK: 3.2,          // # Critical threshold triggering shock oscillation spike (1/s)

  // # State Block: Ground Floor 0m Logistics Pickup Bay (Tenstar 2.1 Starting Point)
  PICKUP_BAY: {
    name: 'Ground Floor Logistics Pickup Bay',
    radiusM: 16.0,                    // # Pickup Bay Radius R = 16.0m
    angleDeg: 45.0,                   // # Pickup Bay Bearing Theta = 45.0 deg (Northeast)
    heightM: 0.0,                     // # Ground Level (0.0m)
    toleranceRadiusM: 3.0,            // # Proximity tolerance: 16 ± 3m
    toleranceAngleDeg: 15.0,          // # Azimuth tolerance: 45 ± 15 deg
    toleranceHeightM: 3.0             // # Hook height ceiling: H <= 3.0m
  },

  // # State Block: Multi-Load Tenstar Exercise 2.1 Payloads (Ground Floor to 5th/6th Floor)
  LOADS: [
    {
      id: 'LOAD_1_REBAR',
      name: 'Steel Rebar Bundle',
      massTonnes: 2.4,
      color: '#38bdf8',
      pickupHeightM: 0.0,
      target: {
        floor: '5th Floor Slab',
        radiusM: 30.0,
        angleDeg: 135.0,
        heightM: 18.0,
        toleranceRadiusM: 2.5,
        toleranceAngleDeg: 6.0,
        toleranceHeightM: 1.2
      }
    },
    {
      id: 'LOAD_2_PRECAST_BEAM',
      name: 'Precast Concrete Beam',
      massTonnes: 3.5,
      color: '#fbbf24',
      pickupHeightM: 0.0,
      target: {
        floor: '6th Floor Roof Deck',
        radiusM: 34.0,
        angleDeg: 150.0,
        heightM: 22.0,
        toleranceRadiusM: 2.5,
        toleranceAngleDeg: 6.0,
        toleranceHeightM: 1.2
      }
    },
    {
      id: 'LOAD_3_HVAC_CHILLER',
      name: 'HVAC Chiller Unit',
      massTonnes: 1.8,
      color: '#c084fc',
      pickupHeightM: 0.0,
      target: {
        floor: '6th Floor Roof Deck',
        radiusM: 28.0,
        angleDeg: 120.0,
        heightM: 22.0,
        toleranceRadiusM: 2.5,
        toleranceAngleDeg: 6.0,
        toleranceHeightM: 1.2
      }
    }
  ],

  // # State Block: Backward-Compatible Target Zone
  TARGET_ZONE: {
    name: '5th Floor Target Landing Slab',
    radiusM: 30.0,
    angleDeg: 135.0,
    heightM: 18.0,
    toleranceRadiusM: 2.5,
    toleranceAngleDeg: 6.0,
    toleranceHeightM: 1.2
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

  // # State Block: 6-Story High-Rise Building Floors (Ground 0m to 6th Floor Roof 22m)
  BUILDING_FLOORS: [
    { name: 'Ground Floor', heightM: 0.0, slabThicknessM: 0.6, color: '#475569', label: 'GF (0m)' },
    { name: '1st Floor', heightM: 3.5, slabThicknessM: 0.4, color: '#334155', label: '1F (3.5m)' },
    { name: '2nd Floor', heightM: 7.0, slabThicknessM: 0.4, color: '#334155', label: '2F (7m)' },
    { name: '3rd Floor', heightM: 10.5, slabThicknessM: 0.4, color: '#334155', label: '3F (10.5m)' },
    { name: '4th Floor', heightM: 14.0, slabThicknessM: 0.4, color: '#334155', label: '4F (14m)' },
    { name: '5th Floor Slab', heightM: 18.0, slabThicknessM: 0.6, color: '#10b981', label: '5F (18m)' },
    { name: '6th Floor Roof Deck', heightM: 22.0, slabThicknessM: 0.6, color: '#f59e0b', label: '6F Roof (22m)' }
  ],

  // # State Block: Side Elevation Obstacles & Scaffolding Floors
  OBSTACLES: [
    { name: 'Ground Floor Logistics Bay', baseHeightM: 0.0, topHeightM: 1.0, minRM: 10.0, maxRM: 45.0, color: '#334155' },
    { name: 'Floors 1-4 Building Facade', baseHeightM: 1.0, topHeightM: 14.0, minRM: 24.0, maxRM: 38.0, color: '#475569' },
    { name: '5th Floor Target Slab', baseHeightM: 14.0, topHeightM: 18.0, minRM: 26.0, maxRM: 34.0, color: '#10b981' },
    { name: '6th Floor Roof Deck', baseHeightM: 18.0, topHeightM: 22.0, minRM: 26.0, maxRM: 36.0, color: '#f59e0b' }
  ]
};

// # Class: CranePhysicsEngine - Mechanical Kinematics, Dynamics & Canvas Render Engine
class CranePhysicsEngine {
  // # Function: Constructor initializing kinematics, multi-load state, and ODE states
  constructor() {
    // # State Block: Kinematic Spatial Coordinates (Starts near Ground Bay with Hook elevated)
    this.slewAngleDeg = 45.0;          // # Pointed toward Ground Pickup Bay (45 deg)
    this.trolleyRadiusM = 16.0;        // # Aligned with Ground Pickup Bay (R = 16m)
    this.hookElevationM = 8.0;         // # Safe initial elevation above ground
    this.cableLengthM = 28.0;          // # Suspended hoist wire rope length L = Cab_Height - z

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
    this.isAtPickupBay = false;
    this.isInExclusionZone = false;
    this.activeExclusionName = '';
    this.isEmergencyStopped = false;

    // # State Block: Tenstar Exercise 2.1 Multi-Load & Interactive Crew Rigging State
    this.hasLoad = false;              // # Empty hook start requirement
    this.riggingMode = 'HOOK_CREW';    // # 'HOOK_CREW' or 'ELECTRO_MAGNET'
    this.currentLoadIndex = 0;         // # Index 0: Rebar (2.4t), 1: Precast Beam (3.5t), 2: Chiller (1.8t)
    this.deliveredLoads = [];          // # Successfully placed payloads on building decks
    this.crewState = 'IDLE';           // # 'IDLE' | 'GROUND_RIGGING' | 'ROOF_UNRIGGING'
    this.crewTimer = 0.0;              // # Rigging animation elapsed timer (0 to 2.0s)
    this.crewDuration = 2.0;           // # 2.0-second rigging duration
    this.crewSafetyBreach = false;     // # Flagged if joysticks move while crew rigs
    this.crewBreachMessage = '';       // # Safety breach HUD message
    this.crewBreachTimer = 0.0;        // # Breach warning banner countdown
    this.magnetEngaged = false;        // # Electro-magnet attraction state

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
    const activePayloadMass = this.getCurrentPayloadMass();
    const loadForceKn = activePayloadMass * g;
    const currentMomentKnm = loadForceKn * this.trolleyRadiusM;
    const swlPercent = (currentMomentKnm / CRANE_PHYSICS_CONFIG.RATED_MOMENT_KNM) * 100;

    // # -------------------------------------------------------------
    // # 5. Evaluate Crew Rigging Lifecycle & Strict Safety Motion Rules
    // # -------------------------------------------------------------
    if (this.crewState === 'GROUND_RIGGING' || this.crewState === 'ROOF_UNRIGGING') {
      // # STRICT SAFETY RULE: Operator must not touch joysticks while crew is attaching/detaching slings
      const isMoving =
        Math.abs(this.currentInputVector.slew) > 0.05 ||
        Math.abs(this.currentInputVector.trolley) > 0.05 ||
        Math.abs(this.currentInputVector.hoist) > 0.05;

      if (isMoving) {
        this.crewSafetyBreach = true;
        this.crewBreachMessage = 'RIGGER SAFETY BREACH: CRANE MOVED WHILE CREW RIGGING! -15% SAFETY PENALTY!';
        this.crewBreachTimer = 4.0;
        this.crewState = 'IDLE';
        this.crewTimer = 0.0;

        // Apply strict 15% safety penalty to Career Telemetry
        if (typeof window !== 'undefined' && window.CareerTelemetry) {
          window.CareerTelemetry.deductSafety(15.0, 'Rigger Safety Breach: Controls moved while ground/roof crew in rigging zone');
        }
      } else {
        this.crewTimer += dt;
        if (this.crewTimer >= this.crewDuration) {
          if (this.crewState === 'GROUND_RIGGING') {
            this.hasLoad = true;
            this.crewState = 'IDLE';
            this.crewTimer = 0.0;
          } else if (this.crewState === 'ROOF_UNRIGGING') {
            this.hasLoad = false;
            const currentLoad = CRANE_PHYSICS_CONFIG.LOADS[this.currentLoadIndex];
            if (currentLoad) {
              this.deliveredLoads.push({
                ...currentLoad,
                deliveredAt: Date.now(),
                landingFloor: currentLoad.target.floor
              });
              this.currentLoadIndex++;
            }
            this.crewState = 'IDLE';
            this.crewTimer = 0.0;

            // Award ₦15,000 Safety Naira bonus
            if (typeof window !== 'undefined' && window.CareerTelemetry) {
              window.CareerTelemetry.awardLoadDeliveryBonus(15000);
            }
          }
        }
      }
    }

    if (this.crewBreachTimer > 0) {
      this.crewBreachTimer -= dt;
      if (this.crewBreachTimer <= 0) {
        this.crewBreachMessage = '';
        this.crewSafetyBreach = false;
      }
    }

    // # -------------------------------------------------------------
    // # 6. Evaluate Target Zone & Exclusion Zone Proximity
    // # -------------------------------------------------------------
    this.evaluateZoneProximity();

    // # -------------------------------------------------------------
    // # 7. Synchronize DOM Telemetry HUD Elements & Calling Buttons
    // # -------------------------------------------------------------
    this.updateDomHUD(swlPercent, currentMomentKnm);
    this.updateCallingButtonsDOM();
  }

  // # Function: Get current active suspended payload mass in metric tonnes
  getCurrentPayloadMass() {
    if (!this.hasLoad) return 0.0; // Hook tare block mass treated as machinery constant
    const load = CRANE_PHYSICS_CONFIG.LOADS[this.currentLoadIndex];
    return load ? load.massTonnes : 0.0;
  }

  // # Function: Check if Hook is within Ground Floor Pickup Bay Tolerance
  isHookInPickupBay() {
    const pb = CRANE_PHYSICS_CONFIG.PICKUP_BAY;
    const radialErr = Math.abs(this.trolleyRadiusM - pb.radiusM);
    let angleErr = Math.abs(this.slewAngleDeg - pb.angleDeg);
    if (angleErr > 180) angleErr = 360 - angleErr;
    const heightOk = this.hookElevationM <= pb.toleranceHeightM;

    return radialErr <= pb.toleranceRadiusM && angleErr <= pb.toleranceAngleDeg && heightOk;
  }

  // # Function: Check if Hook is within Active Load Target Landing Zone Tolerance
  isHookInTargetZone() {
    const currentLoad = CRANE_PHYSICS_CONFIG.LOADS[this.currentLoadIndex];
    if (!currentLoad) return false;
    const tz = currentLoad.target;
    const radialErr = Math.abs(this.trolleyRadiusM - tz.radiusM);
    let angleErr = Math.abs(this.slewAngleDeg - tz.angleDeg);
    if (angleErr > 180) angleErr = 360 - angleErr;
    const heightErr = Math.abs(this.hookElevationM - tz.heightM);

    return (
      radialErr <= tz.toleranceRadiusM &&
      angleErr <= tz.toleranceAngleDeg &&
      heightErr <= tz.toleranceHeightM &&
      this.totalSwayAngleDeg < 3.5
    );
  }

  // # Function: User triggers "Call Ground Crew" to attach payload
  callGroundCrew() {
    if (this.currentLoadIndex >= CRANE_PHYSICS_CONFIG.LOADS.length) {
      return { success: false, reason: 'All 3 Tenstar contracts completed!' };
    }
    if (this.hasLoad) {
      return { success: false, reason: 'Hook already carrying a load! Proceed to target landing deck.' };
    }
    if (this.crewState !== 'IDLE') {
      return { success: false, reason: 'Crew rigging currently in progress!' };
    }

    if (this.riggingMode === 'ELECTRO_MAGNET') {
      if (this.isHookInPickupBay()) {
        this.hasLoad = true;
        this.magnetEngaged = true;
        this.updateCallingButtonsDOM();
        return { success: true, message: '⚡ Electro-Magnet Energized: Payload Attached Instantly!' };
      } else {
        return { success: false, reason: 'Hook must be within Ground Pickup Zone (R:16m, θ:45°, H<3m) to energize magnet!' };
      }
    }

    // Ground Crew Hook Mode
    if (!this.isHookInPickupBay()) {
      return { success: false, reason: 'Hook out of range! Lower hook to Ground Pickup Bay (R:16m, θ:45°, H<3m).' };
    }

    // Initiate 2-second rigging sequence
    this.crewState = 'GROUND_RIGGING';
    this.crewTimer = 0.0;
    this.crewSafetyBreach = false;
    this.updateCallingButtonsDOM();
    return { success: true, message: '👷 Ground Crew Dispatched! Hold controls in neutral during rigging!' };
  }

  // # Function: User triggers "Call Roof Crew" to detach and land payload
  callRoofCrew() {
    if (!this.hasLoad) {
      return { success: false, reason: 'Hook is empty! Pick up a payload from Ground Bay first.' };
    }
    if (this.crewState !== 'IDLE') {
      return { success: false, reason: 'Crew operation currently in progress!' };
    }

    const currentLoad = CRANE_PHYSICS_CONFIG.LOADS[this.currentLoadIndex];

    if (this.riggingMode === 'ELECTRO_MAGNET') {
      if (this.isHookInTargetZone()) {
        this.hasLoad = false;
        this.magnetEngaged = false;
        if (currentLoad) {
          this.deliveredLoads.push({
            ...currentLoad,
            deliveredAt: Date.now(),
            landingFloor: currentLoad.target.floor
          });
          this.currentLoadIndex++;
        }
        if (typeof window !== 'undefined' && window.CareerTelemetry) {
          window.CareerTelemetry.awardLoadDeliveryBonus(15000);
        }
        this.updateCallingButtonsDOM();
        return { success: true, message: '⚡ Electro-Magnet De-Energized: Payload Safely Released on Target Deck!' };
      } else {
        return { success: false, reason: 'Position payload onto target floor landing deck before releasing magnet!' };
      }
    }

    // Roof Crew Unhook Mode
    if (!this.isHookInTargetZone()) {
      const targetName = currentLoad ? currentLoad.target.floor : 'Target Deck';
      return { success: false, reason: `Hook out of tolerance! Stabilize payload over ${targetName}.` };
    }

    // Initiate 2-second unrigging sequence
    this.crewState = 'ROOF_UNRIGGING';
    this.crewTimer = 0.0;
    this.crewSafetyBreach = false;
    this.updateCallingButtonsDOM();
    return { success: true, message: '🏗️ Roof Landing Crew Dispatched! Hold controls steady during sling detachment!' };
  }

  // # Function: Toggle between Hook Crew Rigging and Electro-Magnet Mode
  toggleRiggingMode() {
    this.riggingMode = this.riggingMode === 'HOOK_CREW' ? 'ELECTRO_MAGNET' : 'HOOK_CREW';
    this.updateCallingButtonsDOM();
    return this.riggingMode;
  }

  // # Function: Evaluate Target Landing Drop Zone & Exclusion Zone Violations
  evaluateZoneProximity() {
    const currentLoad = CRANE_PHYSICS_CONFIG.LOADS[this.currentLoadIndex];
    const tz = currentLoad ? currentLoad.target : CRANE_PHYSICS_CONFIG.TARGET_ZONE;

    // # Check Target Radial and Height Error
    const radialError = Math.abs(this.trolleyRadiusM - tz.radiusM);
    const heightError = Math.abs(this.hookElevationM - tz.heightM);

    // # Check Angular Error with modular wrap-around
    let angleDiff = Math.abs(this.slewAngleDeg - tz.angleDeg);
    if (angleDiff > 180) angleDiff = 360 - angleDiff;

    // # Condition: Target zone reached with stable pendulum sway
    this.isOnTarget =
      this.hasLoad &&
      radialError <= tz.toleranceRadiusM &&
      angleDiff <= tz.toleranceAngleDeg &&
      heightError <= tz.toleranceHeightM &&
      this.totalSwayAngleDeg < 3.0;

    // # Check Pickup Bay Proximity
    this.isAtPickupBay = this.isHookInPickupBay();

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
    const loadVal = document.getElementById('hud-load-val');
    const pendulumTag = document.getElementById('hud-pendulum-tag');
    const dropStatusTag = document.getElementById('hud-drop-status');

    if (slewVal) slewVal.textContent = `${this.slewAngleDeg.toFixed(1)}°`;
    if (radiusVal) radiusVal.textContent = `${this.trolleyRadiusM.toFixed(1)}`;
    if (heightVal) heightVal.textContent = `${this.hookElevationM.toFixed(1)}`;
    if (momentVal) momentVal.textContent = `${momentKnm.toFixed(1)}`;

    if (loadVal) {
      if (this.hasLoad) {
        const load = CRANE_PHYSICS_CONFIG.LOADS[this.currentLoadIndex];
        loadVal.textContent = `${load ? load.massTonnes.toFixed(1) : '0.0'} t`;
        loadVal.className = 'gauge-val warn';
      } else {
        loadVal.textContent = '0.0 t (EMPTY)';
        loadVal.className = 'gauge-val safe';
      }
    }

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
      const currentLoad = CRANE_PHYSICS_CONFIG.LOADS[this.currentLoadIndex];

      if (this.crewSafetyBreach) {
        dropStatusTag.textContent = '⚠️ SAFETY BREACH: CONTROLS MOVED DURING RIGGING!';
        dropStatusTag.style.color = 'var(--safety-red)';
        dropStatusTag.style.borderColor = 'var(--safety-red)';
      } else if (this.crewState === 'GROUND_RIGGING') {
        dropStatusTag.textContent = '👷 GROUND RIGGER ATTACHING SLING (HOLD CONTROLS NEUTRAL)';
        dropStatusTag.style.color = 'var(--safety-amber)';
        dropStatusTag.style.borderColor = 'var(--safety-amber)';
      } else if (this.crewState === 'ROOF_UNRIGGING') {
        dropStatusTag.textContent = '🏗️ ROOF CREW DETACHING SLING (HOLD CONTROLS NEUTRAL)';
        dropStatusTag.style.color = 'var(--safety-cyan)';
        dropStatusTag.style.borderColor = 'var(--safety-cyan)';
      } else if (this.isInExclusionZone) {
        dropStatusTag.textContent = `⚠️ VIOLATION: ${this.activeExclusionName}`;
        dropStatusTag.style.color = 'var(--safety-red)';
        dropStatusTag.style.borderColor = 'var(--safety-red)';
      } else if (this.isOnTarget) {
        const floorName = currentLoad ? currentLoad.target.floor : 'TARGET SLAB';
        dropStatusTag.textContent = `🎯 TARGET ${floorName.toUpperCase()} REACHED (STABILIZED - CALL CREW)`;
        dropStatusTag.style.color = 'var(--safety-emerald)';
        dropStatusTag.style.borderColor = 'var(--safety-emerald)';
      } else if (!this.hasLoad) {
        if (this.isAtPickupBay) {
          dropStatusTag.textContent = '📦 IN PICKUP ZONE: READY TO CALL GROUND CREW';
          dropStatusTag.style.color = 'var(--safety-emerald)';
          dropStatusTag.style.borderColor = 'var(--safety-emerald)';
        } else {
          const pb = CRANE_PHYSICS_CONFIG.PICKUP_BAY;
          const rDist = Math.abs(this.trolleyRadiusM - pb.radiusM).toFixed(1);
          dropStatusTag.textContent = `APPROACH PICKUP BAY (R:16m, 45°): ${rDist}m RADIAL OFFSET`;
          dropStatusTag.style.color = 'var(--safety-amber)';
          dropStatusTag.style.borderColor = 'rgba(245, 158, 11, 0.4)';
        }
      } else {
        if (currentLoad) {
          const tz = currentLoad.target;
          const rDist = Math.abs(this.trolleyRadiusM - tz.radiusM).toFixed(1);
          dropStatusTag.textContent = `APPROACH ${tz.floor.toUpperCase()}: ${rDist}m RADIAL OFFSET`;
          dropStatusTag.style.color = 'var(--safety-amber)';
          dropStatusTag.style.borderColor = 'rgba(245, 158, 11, 0.4)';
        }
      }
    }
  }

  // # Function: Synchronize Floating Calling Buttons on HUD with live distance hints
  updateCallingButtonsDOM() {
    const btnGround = document.getElementById('btn-call-ground-crew');
    const btnRoof = document.getElementById('btn-call-roof-crew');
    const btnMagnet = document.getElementById('btn-toggle-magnet');
    const hintGround = document.getElementById('hint-ground-crew');
    const hintRoof = document.getElementById('hint-roof-crew');

    const isMagnet = this.riggingMode === 'ELECTRO_MAGNET';

    // Magnet mode button text
    if (btnMagnet) {
      btnMagnet.innerHTML = isMagnet
        ? `🧲 Mode: <strong>ELECTRO-MAGNET</strong> (Click for Crew)`
        : `👷 Mode: <strong>GROUND/ROOF CREW</strong> (Click for Magnet)`;
      btnMagnet.style.borderColor = isMagnet ? 'var(--safety-cyan)' : 'var(--safety-amber)';
    }

    const currentLoad = CRANE_PHYSICS_CONFIG.LOADS[this.currentLoadIndex];

    // Ground Crew Button
    if (btnGround) {
      if (this.hasLoad) {
        btnGround.classList.remove('pulse-ready');
        btnGround.disabled = true;
        btnGround.style.opacity = '0.5';
        if (hintGround) hintGround.textContent = 'Payload already rigged onto hook';
      } else if (this.currentLoadIndex >= CRANE_PHYSICS_CONFIG.LOADS.length) {
        btnGround.classList.remove('pulse-ready');
        btnGround.disabled = true;
        btnGround.style.opacity = '0.5';
        if (hintGround) hintGround.textContent = 'All 3 contracts delivered!';
      } else if (this.crewState === 'GROUND_RIGGING') {
        btnGround.classList.add('pulse-ready');
        btnGround.disabled = true;
        btnGround.style.opacity = '1.0';
        const progress = Math.min(100, Math.round((this.crewTimer / this.crewDuration) * 100));
        if (hintGround) hintGround.textContent = `Rigging in progress... ${progress}% (HOLD STEADY)`;
      } else {
        const inPickup = this.isHookInPickupBay();
        btnGround.disabled = false;
        btnGround.style.opacity = '1.0';
        if (inPickup) {
          btnGround.classList.add('pulse-ready');
          if (hintGround) hintGround.textContent = isMagnet
            ? '✓ READY TO ATTACH: Hook in magnet pickup range!'
            : '✓ READY TO RIG: Hook in pickup zone! Click to call rigger';
        } else {
          btnGround.classList.remove('pulse-ready');
          const pb = CRANE_PHYSICS_CONFIG.PICKUP_BAY;
          const rDiff = (this.trolleyRadiusM - pb.radiusM).toFixed(1);
          let aDiff = (this.slewAngleDeg - pb.angleDeg);
          if (aDiff > 180) aDiff -= 360;
          if (aDiff < -180) aDiff += 360;
          const h = this.hookElevationM.toFixed(1);
          if (hintGround) {
            hintGround.textContent = `Zone Range: R:${pb.radiusM}m (Δ${rDiff > 0 ? '+' : ''}${rDiff}m), θ:${pb.angleDeg}° (Δ${aDiff > 0 ? '+' : ''}${aDiff.toFixed(0)}°), H<3m (${h}m)`;
          }
        }
      }

      if (isMagnet) {
        btnGround.innerHTML = `<span>⚡ ${this.hasLoad ? 'MAGNET ENERGIZED' : 'ENERGIZE MAGNET (ATTACH)'}</span>`;
      } else {
        const loadName = currentLoad ? currentLoad.name : 'Payload';
        btnGround.innerHTML = `<span>📞👷 Call Ground Crew (Rig ${loadName})</span>`;
      }
    }

    // Roof Crew Button
    if (btnRoof) {
      if (!this.hasLoad) {
        btnRoof.classList.remove('pulse-ready');
        btnRoof.disabled = true;
        btnRoof.style.opacity = '0.5';
        if (hintRoof) hintRoof.textContent = 'Hook is empty - rig load from Ground first';
      } else if (this.crewState === 'ROOF_UNRIGGING') {
        btnRoof.classList.add('pulse-ready');
        btnRoof.disabled = true;
        btnRoof.style.opacity = '1.0';
        const progress = Math.min(100, Math.round((this.crewTimer / this.crewDuration) * 100));
        if (hintRoof) hintRoof.textContent = `Unhooking in progress... ${progress}% (HOLD STEADY)`;
      } else {
        const inTarget = this.isHookInTargetZone();
        btnRoof.disabled = false;
        btnRoof.style.opacity = '1.0';
        if (inTarget) {
          btnRoof.classList.add('pulse-ready');
          if (hintRoof) hintRoof.textContent = isMagnet
            ? '✓ READY TO RELEASE: In target deck landing tolerance!'
            : (currentLoad ? `✓ READY TO LAND: Stabilized over ${currentLoad.target.floor}! Click to unhook` : '✓ READY TO LAND');
        } else {
          btnRoof.classList.remove('pulse-ready');
          if (currentLoad) {
            const tz = currentLoad.target;
            const rDiff = (this.trolleyRadiusM - tz.radiusM).toFixed(1);
            let aDiff = (this.slewAngleDeg - tz.angleDeg);
            if (aDiff > 180) aDiff -= 360;
            if (aDiff < -180) aDiff += 360;
            const hDiff = (this.hookElevationM - tz.heightM).toFixed(1);
            if (hintRoof) {
              hintRoof.textContent = `Target ${tz.floor}: R:${tz.radiusM}m (Δ${rDiff > 0 ? '+' : ''}${rDiff}m), θ:${tz.angleDeg}° (Δ${aDiff > 0 ? '+' : ''}${aDiff.toFixed(0)}°), H:${tz.heightM}m (Δ${hDiff > 0 ? '+' : ''}${hDiff}m)`;
            }
          }
        }
      }

      if (isMagnet) {
        btnRoof.innerHTML = `<span>⚡ ${!this.hasLoad ? 'MAGNET RELEASED' : 'DE-ENERGIZE MAGNET (RELEASE)'}</span>`;
      } else {
        const targetFloor = currentLoad ? currentLoad.target.floor : 'Target Deck';
        btnRoof.innerHTML = `<span>📞🏗️ Call ${targetFloor} Crew (Unhook)</span>`;
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

    // # Safety Guard: Do not attempt to render into a collapsed, hidden, or zero-dimension canvas
    if (w < 100 || h < 100) return;

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
    this.renderOscilloscope(ctx, 16, Math.max(10, h - 54), Math.max(50, w - 32), 44);
  }

  // # Function: Render Left Half - 360-Degree Slew Radar with Tenstar Multi-Load Zones
  renderTopDownRadar(ctx, x, y, width, height) {
    // # Background Fill
    ctx.fillStyle = '#070d1e';
    ctx.fillRect(x, y, width, height);

    // # Radar Center Origin (Mast Location)
    const centerX = x + width / 2;
    const centerY = y + height / 2 - 16;
    // # Clamped radar radius preventing negative or degenerate radius on hidden canvas
    const radarRadius = Math.max(20, Math.min(width / 2 - 36, height / 2 - 48));

    // # Radar Outer Degree Scale Ring
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(centerX, centerY, Math.max(1, radarRadius), 0, Math.PI * 2);
    ctx.stroke();

    // # Radar Concentric Distance Range Rings (10m, 20m, 30m, 40m, 50m)
    const ranges = [10, 20, 30, 40, 50];
    ctx.font = '10px monospace';
    ctx.fillStyle = '#64748b';
    ranges.forEach((r) => {
      const ringPx = Math.max(1, (r / CRANE_PHYSICS_CONFIG.JIB_LENGTH_MAX) * radarRadius);
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
      const innerPx = Math.max(1, (zone.minRadiusM / CRANE_PHYSICS_CONFIG.JIB_LENGTH_MAX) * radarRadius);
      const outerPx = Math.max(innerPx + 2, (zone.maxRadiusM / CRANE_PHYSICS_CONFIG.JIB_LENGTH_MAX) * radarRadius);

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

    // # Draw Ground Logistics Pickup Bay (R = 16m, Theta = 45 deg)
    const pb = CRANE_PHYSICS_CONFIG.PICKUP_BAY;
    const pickupRad = ((pb.angleDeg - 90) * Math.PI) / 180;
    const pickupDistPx = (pb.radiusM / CRANE_PHYSICS_CONFIG.JIB_LENGTH_MAX) * radarRadius;
    const pickupX = centerX + Math.cos(pickupRad) * pickupDistPx;
    const pickupY = centerY + Math.sin(pickupRad) * pickupDistPx;
    const pickupTolPx = (pb.toleranceRadiusM / CRANE_PHYSICS_CONFIG.JIB_LENGTH_MAX) * radarRadius * 2;

    const isPickupActive = !this.hasLoad && this.isHookInPickupBay();
    ctx.fillStyle = isPickupActive ? 'rgba(16, 185, 129, 0.35)' : 'rgba(16, 185, 129, 0.12)';
    ctx.strokeStyle = isPickupActive ? '#10b981' : 'rgba(16, 185, 129, 0.6)';
    ctx.lineWidth = isPickupActive ? 2.5 : 1.5;
    ctx.setLineDash([5, 4]);
    ctx.beginPath();
    ctx.arc(pickupX, pickupY, Math.max(14, pickupTolPx), 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.setLineDash([]);

    // Pickup Bay Center Marker & Icon
    ctx.fillStyle = '#10b981';
    ctx.beginPath();
    ctx.arc(pickupX, pickupY, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.font = '9px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('0m PICKUP BAY', pickupX, pickupY - 14);

    // If crew is currently hooking on ground, draw animated worker radar beacon
    if (this.crewState === 'GROUND_RIGGING') {
      ctx.strokeStyle = '#f97316';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(pickupX, pickupY, 18 + Math.sin(Date.now() / 150) * 4, 0, Math.PI * 2);
      ctx.stroke();
      ctx.fillStyle = '#f97316';
      ctx.fillText('👷 RIGGER', pickupX, pickupY + 22);
    }

    // # Draw Delivered Loads Markers
    this.deliveredLoads.forEach((dl) => {
      const dRad = ((dl.target.angleDeg - 90) * Math.PI) / 180;
      const dDistPx = (dl.target.radiusM / CRANE_PHYSICS_CONFIG.JIB_LENGTH_MAX) * radarRadius;
      const dX = centerX + Math.cos(dRad) * dDistPx;
      const dY = centerY + Math.sin(dRad) * dDistPx;

      ctx.fillStyle = '#10b981';
      ctx.font = 'bold 11px system-ui';
      ctx.fillText('✓', dX, dY + 4);
    });

    // # Draw Active Target Landing Zone Bullseye
    const currentLoad = CRANE_PHYSICS_CONFIG.LOADS[this.currentLoadIndex];
    if (currentLoad) {
      const tz = currentLoad.target;
      const targetRad = ((tz.angleDeg - 90) * Math.PI) / 180;
      const targetDistPx = (tz.radiusM / CRANE_PHYSICS_CONFIG.JIB_LENGTH_MAX) * radarRadius;
      const targetX = centerX + Math.cos(targetRad) * targetDistPx;
      const targetY = centerY + Math.sin(targetRad) * targetDistPx;
      const targetTolPx = (tz.toleranceRadiusM / CRANE_PHYSICS_CONFIG.JIB_LENGTH_MAX) * radarRadius * 2;

      ctx.fillStyle = this.isOnTarget ? 'rgba(16, 185, 129, 0.4)' : 'rgba(245, 158, 11, 0.15)';
      ctx.strokeStyle = this.isOnTarget ? '#10b981' : '#f59e0b';
      ctx.lineWidth = this.isOnTarget ? 2.5 : 1.5;
      ctx.setLineDash([6, 4]);
      ctx.beginPath();
      ctx.arc(targetX, targetY, Math.max(14, targetTolPx), 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.setLineDash([]);

      // Inner Bullseye Dot
      ctx.fillStyle = this.isOnTarget ? '#10b981' : '#f59e0b';
      ctx.beginPath();
      ctx.arc(targetX, targetY, 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.font = '9px monospace';
      ctx.fillText(`TARGET: ${tz.floor}`, targetX, targetY - 14);

      // If roof crew is unhooking, draw landing crew radar beacon
      if (this.crewState === 'ROOF_UNRIGGING') {
        ctx.strokeStyle = '#06b6d4';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(targetX, targetY, 18 + Math.sin(Date.now() / 150) * 4, 0, Math.PI * 2);
        ctx.stroke();
        ctx.fillStyle = '#06b6d4';
        ctx.fillText('🏗️ CREW', targetX, targetY + 22);
      }
    }

    // # Rotating Jib & Counter-Jib Structure
    // # Math: 0 deg = North (-Y on screen) -> Radian = (slewAngleDeg - 90) * PI / 180
    const slewRad = ((this.slewAngleDeg - 90) * Math.PI) / 180;
    const counterSlewRad = slewRad + Math.PI;

    // Working Jib Beam Line (Right)
    const jibTipX = centerX + Math.cos(slewRad) * radarRadius;
    const jibTipY = centerY + Math.sin(slewRad) * radarRadius;
    ctx.strokeStyle = '#eab308';
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
    ctx.strokeStyle = '#eab308';
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

    // Suspended Hook / Load Circle
    if (!this.hasLoad) {
      // Empty hook ring
      ctx.strokeStyle = this.isInputShockActive ? '#ef4444' : '#eab308';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(loadX, loadY, 5, 0, Math.PI * 2);
      ctx.stroke();
    } else {
      // Carrying Load circle
      ctx.fillStyle = currentLoad ? currentLoad.color : (this.isInputShockActive ? '#ef4444' : '#f59e0b');
      ctx.beginPath();
      ctx.arc(loadX, loadY, 7, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 1;
      ctx.stroke();
    }

    // Panel Header Badge
    ctx.textAlign = 'left';
    ctx.fillStyle = '#f8fafc';
    ctx.font = 'bold 11px system-ui';
    ctx.fillText('360° SLEW RADAR & DROP ZONE', x + 16, y + 22);
    ctx.fillStyle = '#94a3b8';
    ctx.font = '10px monospace';
    const loadDesc = this.hasLoad && currentLoad ? `${currentLoad.name} (${currentLoad.massTonnes}t)` : 'EMPTY HOOK';
    ctx.fillText(`BEARING: ${this.slewAngleDeg.toFixed(1)}° | RADIUS: ${this.trolleyRadiusM.toFixed(1)}m | ${loadDesc}`, x + 16, y + 36);
  }

  // # Function: Render Right Half - Side-Elevation Height Gauge & 6-Story High-Rise
  renderSideElevation(ctx, x, y, width, height) {
    // # Background Fill
    ctx.fillStyle = '#050914';
    ctx.fillRect(x, y, width, height);

    // # Elevation Scaling & Floor Datum Coordinates
    const marginL = 55;
    const marginB = 75;
    const groundY = y + height - marginB;
    const maxPlotHeight = height - marginB - 55;
    const apexHeightM = 40.0; // Scale top height up to 40m for 36m mast + cathead apex

    // # Function: Convert elevation in meters to Canvas Y Coordinate
    // # Equation: py = groundY - (meters / apexHeightM) * maxPlotHeight
    const meterToY = (meters) => groundY - (meters / apexHeightM) * maxPlotHeight;

    // # Coordinate Scale for Radius X
    const scaleX = (r) => x + marginL + ((r - 4.0) / 44.0) * (width - marginL - 50);

    // # Vertical Elevation Ruler Axis
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(x + marginL, y + 35);
    ctx.lineTo(x + marginL, groundY);
    ctx.stroke();

    // # Tick Marks (0m to 40m in 4m increments)
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

    // # Draw Ground Pickup Bay (0m at R = 16m)
    const pickupBayX = scaleX(16.0);
    ctx.fillStyle = 'rgba(16, 185, 129, 0.2)';
    ctx.strokeStyle = '#10b981';
    ctx.lineWidth = 2;
    ctx.fillRect(pickupBayX - 22, groundY - 6, 44, 6);
    ctx.strokeRect(pickupBayX - 22, groundY - 6, 44, 6);

    ctx.fillStyle = '#10b981';
    ctx.font = '8px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('0m PICKUP BAY', pickupBayX, groundY + 14);

    // If hook is empty and load is awaiting pickup, draw waiting payload on ground
    const currentLoad = CRANE_PHYSICS_CONFIG.LOADS[this.currentLoadIndex];
    if (!this.hasLoad && currentLoad) {
      ctx.fillStyle = currentLoad.color;
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1;
      ctx.fillRect(pickupBayX - 12, groundY - 18, 24, 12);
      ctx.strokeRect(pickupBayX - 12, groundY - 18, 24, 12);
      ctx.fillStyle = '#0f172a';
      ctx.font = 'bold 7px monospace';
      ctx.fillText(`${currentLoad.massTonnes}t`, pickupBayX, groundY - 9);
    }

    // # -------------------------------------------------------------
    // # Draw 6-Story High-Rise Building Architecture (Workbook 6.11)
    // # -------------------------------------------------------------
    const bldgMinX = scaleX(25.0);
    const bldgMaxX = scaleX(37.0);
    const bldgWidth = bldgMaxX - bldgMinX;
    const roofY = meterToY(22.0);
    const bldgHeight = groundY - roofY;

    // Building Main Core Facade
    ctx.fillStyle = 'rgba(30, 41, 59, 0.65)';
    ctx.fillRect(bldgMinX, roofY, bldgWidth, bldgHeight);
    ctx.strokeStyle = '#475569';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(bldgMinX, roofY, bldgWidth, bldgHeight);

    // Structural Concrete Columns (Left, Center, Right)
    ctx.fillStyle = '#334155';
    ctx.fillRect(bldgMinX, roofY, 8, bldgHeight);
    ctx.fillRect(bldgMinX + bldgWidth / 2 - 4, roofY, 8, bldgHeight);
    ctx.fillRect(bldgMaxX - 8, roofY, 8, bldgHeight);

    // Draw Floor Slabs (GF 0m, 1F 3.5m, 2F 7m, 3F 10.5m, 4F 14m, 5F 18m, 6F Roof 22m)
    CRANE_PHYSICS_CONFIG.BUILDING_FLOORS.forEach((floor) => {
      const slabY = meterToY(floor.heightM);
      const isTargetFloor = currentLoad && currentLoad.target.heightM === floor.heightM;

      ctx.fillStyle = isTargetFloor ? 'rgba(16, 185, 129, 0.35)' : 'rgba(51, 65, 85, 0.9)';
      ctx.strokeStyle = isTargetFloor ? '#10b981' : floor.color;
      ctx.lineWidth = isTargetFloor ? 2 : 1;

      // Slab beam
      ctx.fillRect(bldgMinX, slabY - 3, bldgWidth, 6);
      ctx.strokeRect(bldgMinX, slabY - 3, bldgWidth, 6);

      // Floor Marker Label
      ctx.fillStyle = isTargetFloor ? '#10b981' : '#94a3b8';
      ctx.font = isTargetFloor ? 'bold 8px monospace' : '8px monospace';
      ctx.textAlign = 'left';
      ctx.fillText(floor.label, bldgMaxX + 6, slabY + 3);

      // Window Bays between floors
      if (floor.heightM > 0 && floor.heightM <= 18.0) {
        const prevSlabY = meterToY(floor.heightM - 3.5);
        const winH = (prevSlabY - slabY) * 0.55;
        const winY = slabY + 4;

        ctx.fillStyle = 'rgba(56, 189, 248, 0.15)';
        ctx.strokeStyle = 'rgba(56, 189, 248, 0.3)';
        ctx.lineWidth = 1;

        // Bay 1
        ctx.fillRect(bldgMinX + 12, winY, (bldgWidth / 2) - 20, winH);
        ctx.strokeRect(bldgMinX + 12, winY, (bldgWidth / 2) - 20, winH);

        // Bay 2
        ctx.fillRect(bldgMinX + (bldgWidth / 2) + 8, winY, (bldgWidth / 2) - 20, winH);
        ctx.strokeRect(bldgMinX + (bldgWidth / 2) + 8, winY, (bldgWidth / 2) - 20, winH);
      }
    });

    // Roof Parapet / Handrails (Floor 6 Roof 22m)
    ctx.strokeStyle = '#f59e0b';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(bldgMinX, roofY - 8);
    ctx.lineTo(bldgMaxX, roofY - 8);
    ctx.stroke();

    // Handrail stanchions
    for (let stX = bldgMinX; stX <= bldgMaxX; stX += 16) {
      ctx.beginPath();
      ctx.moveTo(stX, roofY);
      ctx.lineTo(stX, roofY - 8);
      ctx.stroke();
    }

    // Render Delivered Loads Resting on Slabs
    this.deliveredLoads.forEach((dl) => {
      const landingY = meterToY(dl.target.heightM);
      const landingX = scaleX(dl.target.radiusM);

      ctx.fillStyle = dl.color;
      ctx.strokeStyle = '#10b981';
      ctx.lineWidth = 1.5;
      ctx.fillRect(landingX - 10, landingY - 14, 20, 10);
      ctx.strokeRect(landingX - 10, landingY - 14, 20, 10);

      ctx.fillStyle = '#10b981';
      ctx.font = 'bold 7px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(`✓ ${dl.name.split(' ')[0]}`, landingX, landingY - 17);
    });

    // # -------------------------------------------------------------
    // # Modern Tower Crane Lattice Mast & Machinery Apex
    // # -------------------------------------------------------------
    const mastX = x + marginL + 18;
    const mastW = 24;
    const mastTopY = meterToY(CRANE_PHYSICS_CONFIG.CAB_MAST_HEIGHT); // 36m height

    // Mast Vertical Chords (Yellow Safety Enamel)
    ctx.fillStyle = '#0f172a';
    ctx.strokeStyle = '#eab308';
    ctx.lineWidth = 2.5;
    ctx.fillRect(mastX, mastTopY, mastW, groundY - mastTopY);
    ctx.strokeRect(mastX, mastTopY, mastW, groundY - mastTopY);

    // Lattice Diagonal Cross-Bracing
    ctx.strokeStyle = '#ca8a04';
    ctx.lineWidth = 1.2;
    for (let my = mastTopY; my < groundY - 5; my += 18) {
      ctx.beginPath();
      ctx.moveTo(mastX, my);
      ctx.lineTo(mastX + mastW, my + 18);
      ctx.moveTo(mastX + mastW, my);
      ctx.lineTo(mastX, my + 18);
      ctx.stroke();
    }

    // Internal Climbing Ladder Rail
    ctx.strokeStyle = 'rgba(234, 179, 8, 0.4)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(mastX + mastW / 2, mastTopY);
    ctx.lineTo(mastX + mastW / 2, groundY);
    ctx.stroke();

    // Slewing Ring Bearing at 34m
    const slewRingY = meterToY(34.2);
    ctx.fillStyle = '#334155';
    ctx.strokeStyle = '#eab308';
    ctx.lineWidth = 2;
    ctx.fillRect(mastX - 3, slewRingY, mastW + 6, 6);
    ctx.strokeRect(mastX - 3, slewRingY, mastW + 6, 6);

    // Operator Cab at 33.5m - 35.5m (Right flank of mast)
    const cabY = meterToY(35.5);
    const cabW = 18;
    const cabH = 18;
    const cabX = mastX + mastW;

    ctx.fillStyle = '#0f172a';
    ctx.strokeStyle = '#eab308';
    ctx.lineWidth = 1.5;
    ctx.fillRect(cabX, cabY, cabW, cabH);
    ctx.strokeRect(cabX, cabY, cabW, cabH);

    // Cab Glass Panes with cyan tint
    ctx.fillStyle = 'rgba(56, 189, 248, 0.4)';
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 1;
    ctx.fillRect(cabX + 2, cabY + 2, cabW - 4, cabH - 6);
    ctx.strokeRect(cabX + 2, cabY + 2, cabW - 4, cabH - 6);

    // Cab Sun Visor
    ctx.fillStyle = '#eab308';
    ctx.fillRect(cabX, cabY - 2, cabW + 3, 2);

    // Operator figure inside cab
    ctx.fillStyle = '#f97316';
    ctx.beginPath();
    ctx.arc(cabX + 8, cabY + 7, 3, 0, Math.PI * 2);
    ctx.fill();

    // Cat-Head Apex Tower (A-Frame rising to 39m)
    const catHeadApexY = meterToY(39.0);
    const catHeadCenterX = mastX + mastW / 2;

    ctx.strokeStyle = '#eab308';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(mastX, mastTopY);
    ctx.lineTo(catHeadCenterX, catHeadApexY);
    ctx.lineTo(mastX + mastW, mastTopY);
    ctx.stroke();

    // Counter-Jib Structure (Extending Leftwards)
    const counterJibLengthPx = 68;
    const counterTipX = mastX - counterJibLengthPx;
    const jibBeamY = mastTopY;

    ctx.strokeStyle = '#eab308';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(mastX, jibBeamY);
    ctx.lineTo(counterTipX, jibBeamY);
    ctx.stroke();

    // Counter-Jib Tie Pendants from Cathead Apex
    ctx.strokeStyle = '#94a3b8';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(catHeadCenterX, catHeadApexY);
    ctx.lineTo(counterTipX + 15, jibBeamY);
    ctx.stroke();

    // Counterweight Concrete Ballast Blocks
    ctx.fillStyle = '#475569';
    ctx.strokeStyle = '#64748b';
    ctx.lineWidth = 1.5;
    ctx.fillRect(counterTipX, jibBeamY - 4, 28, 16);
    ctx.strokeRect(counterTipX, jibBeamY - 4, 28, 16);
    ctx.fillStyle = '#e2e8f0';
    ctx.font = '7px monospace';
    ctx.fillText('BALLAST', counterTipX + 1, jibBeamY + 7);

    // Working Jib Horizontal Beam at 36m (Apex)
    const jibStartX = mastX + mastW;
    const jibEndX = x + width - 20;

    // Double chord truss
    ctx.strokeStyle = '#eab308';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(jibStartX, jibBeamY);
    ctx.lineTo(jibEndX, jibBeamY);
    ctx.moveTo(jibStartX, jibBeamY - 8);
    ctx.lineTo(jibEndX - 20, jibBeamY);
    ctx.stroke();

    // Jib Truss Webbing
    ctx.strokeStyle = '#ca8a04';
    ctx.lineWidth = 1;
    for (let jx = jibStartX; jx < jibEndX - 20; jx += 16) {
      ctx.beginPath();
      ctx.moveTo(jx, jibBeamY);
      ctx.lineTo(jx + 8, jibBeamY - 8);
      ctx.lineTo(jx + 16, jibBeamY);
      ctx.stroke();
    }

    // Main Jib Pendant Stay Ropes from Cathead Apex to Jib
    ctx.strokeStyle = '#94a3b8';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(catHeadCenterX, catHeadApexY);
    ctx.lineTo(scaleX(20.0), jibBeamY - 8);
    ctx.moveTo(catHeadCenterX, catHeadApexY);
    ctx.lineTo(scaleX(35.0), jibBeamY - 4);
    ctx.stroke();

    // # -------------------------------------------------------------
    // # Trolley Carriage & Wheels
    // # -------------------------------------------------------------
    const trolleyElevationX = scaleX(this.trolleyRadiusM);
    const trolleyElevationY = jibBeamY;

    // Trolley Frame
    ctx.fillStyle = '#0284c7';
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 1.5;
    ctx.fillRect(trolleyElevationX - 10, trolleyElevationY, 20, 8);
    ctx.strokeRect(trolleyElevationX - 10, trolleyElevationY, 20, 8);

    // Trolley Wheels (Running on lower flange)
    ctx.fillStyle = '#1e293b';
    ctx.beginPath();
    ctx.arc(trolleyElevationX - 7, trolleyElevationY - 1, 3, 0, Math.PI * 2);
    ctx.arc(trolleyElevationX + 7, trolleyElevationY - 1, 3, 0, Math.PI * 2);
    ctx.fill();

    // # -------------------------------------------------------------
    // # Hoist Cable Wire Rope & Hook Block with Pendulum Deflection
    // # -------------------------------------------------------------
    const hookRestY = meterToY(this.hookElevationM);
    const cablePixelLength = hookRestY - trolleyElevationY;

    // Pendulum angular deflection phi_r (in plane of radius)
    const phiRad = (this.pendulumRadialDeg * Math.PI) / 180.0;
    const hookX = trolleyElevationX + cablePixelLength * Math.sin(phiRad);
    const hookY = trolleyElevationY + cablePixelLength * Math.cos(phiRad);

    // 4-Fall Hoist Wire Rope (2 pairs of parallel thin silver wires)
    ctx.strokeStyle = '#e2e8f0';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(trolleyElevationX - 3, trolleyElevationY + 8);
    ctx.lineTo(hookX - 3, hookY - 5);
    ctx.moveTo(trolleyElevationX - 1, trolleyElevationY + 8);
    ctx.lineTo(hookX - 1, hookY - 5);
    ctx.moveTo(trolleyElevationX + 1, trolleyElevationY + 8);
    ctx.lineTo(hookX + 1, hookY - 5);
    ctx.moveTo(trolleyElevationX + 3, trolleyElevationY + 8);
    ctx.lineTo(hookX + 3, hookY - 5);
    ctx.stroke();

    // Heavy-Duty Hook Pulley Block (Alternating Yellow/Black Hazard Stripes)
    const blockW = 14;
    const blockH = 14;
    ctx.save();
    ctx.translate(hookX, hookY);
    ctx.rotate(phiRad); // Rotate with pendulum angle

    // Block body
    ctx.fillStyle = '#eab308';
    ctx.fillRect(-blockW / 2, -blockH / 2, blockW, blockH);
    ctx.strokeStyle = '#0f172a';
    ctx.lineWidth = 1;
    ctx.strokeRect(-blockW / 2, -blockH / 2, blockW, blockH);

    // Hazard Stripes on Hook Block
    ctx.fillStyle = '#0f172a';
    ctx.beginPath();
    ctx.moveTo(-blockW / 2 + 2, -blockH / 2);
    ctx.lineTo(-blockW / 2 + 7, -blockH / 2);
    ctx.lineTo(-blockW / 2, -blockH / 2 + 7);
    ctx.lineTo(-blockW / 2, -blockH / 2 + 2);
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(-blockW / 2 + 8, -blockH / 2);
    ctx.lineTo(-blockW / 2 + 13, -blockH / 2);
    ctx.lineTo(-blockW / 2, -blockH / 2 + 13);
    ctx.lineTo(-blockW / 2, -blockH / 2 + 8);
    ctx.fill();

    // Heavy Curved Crane Hook with Safety Latch
    ctx.strokeStyle = '#e2e8f0';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.arc(0, blockH / 2 + 5, 5, -Math.PI / 2, Math.PI / 2);
    ctx.lineTo(4, blockH / 2 + 10);
    ctx.stroke();

    // Spring Safety Latch
    ctx.strokeStyle = '#ef4444';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, blockH / 2 + 1);
    ctx.lineTo(3, blockH / 2 + 8);
    ctx.stroke();

    // # -------------------------------------------------------------
    // # Suspended Load or Empty Hook Logic
    // # -------------------------------------------------------------
    if (this.hasLoad && currentLoad) {
      if (this.riggingMode === 'ELECTRO_MAGNET') {
        // Draw Electro-Magnet Attachment Unit
        ctx.fillStyle = '#0891b2';
        ctx.strokeStyle = '#22d3ee';
        ctx.lineWidth = 2;
        ctx.fillRect(-12, blockH / 2 + 11, 24, 6);
        ctx.strokeRect(-12, blockH / 2 + 11, 24, 6);

        // Magnetic Field Coils glow
        ctx.fillStyle = '#67e8f9';
        ctx.fillRect(-8, blockH / 2 + 13, 16, 2);

        // Load Box attached directly to Magnet
        ctx.fillStyle = currentLoad.color;
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 1.5;
        ctx.fillRect(-16, blockH / 2 + 17, 32, 18);
        ctx.strokeRect(-16, blockH / 2 + 17, 32, 18);

        ctx.fillStyle = '#0f172a';
        ctx.font = 'bold 8px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(`${currentLoad.name.split(' ')[0]}`, 0, blockH / 2 + 28);
        ctx.fillText(`${currentLoad.massTonnes}t`, 0, blockH / 2 + 34);
      } else {
        // Ground Crew Hook Mode: 4-Leg Wire Rope Slings
        const slingBottomY = blockH / 2 + 24;
        ctx.strokeStyle = '#94a3b8';
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        // 4 sling legs from hook shackle to corners of load
        ctx.moveTo(0, blockH / 2 + 10);
        ctx.lineTo(-18, slingBottomY);
        ctx.moveTo(0, blockH / 2 + 10);
        ctx.lineTo(-8, slingBottomY);
        ctx.moveTo(0, blockH / 2 + 10);
        ctx.lineTo(8, slingBottomY);
        ctx.moveTo(0, blockH / 2 + 10);
        ctx.lineTo(18, slingBottomY);
        ctx.stroke();

        // Specific Payload Geometry
        ctx.fillStyle = currentLoad.color;
        ctx.strokeStyle = this.isInputShockActive ? '#ef4444' : '#ffffff';
        ctx.lineWidth = 1.5;
        ctx.fillRect(-20, slingBottomY, 40, 18);
        ctx.strokeRect(-20, slingBottomY, 40, 18);

        // Internal straps / ribs
        ctx.strokeStyle = '#1e293b';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(-10, slingBottomY);
        ctx.lineTo(-10, slingBottomY + 18);
        ctx.moveTo(10, slingBottomY);
        ctx.lineTo(10, slingBottomY + 18);
        ctx.stroke();

        // Payload Text Label
        ctx.fillStyle = '#0f172a';
        ctx.font = 'bold 8px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(`${currentLoad.name.split(' ')[0]}`, 0, slingBottomY + 9);
        ctx.fillText(`${currentLoad.massTonnes}t`, 0, slingBottomY + 16);

        // Tagline hanging from right corner of load
        ctx.strokeStyle = 'rgba(245, 158, 11, 0.7)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(18, slingBottomY + 18);
        ctx.lineTo(24, slingBottomY + 36);
        ctx.stroke();
      }
    }
    ctx.restore();

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

    // # -------------------------------------------------------------
    // # Animated Ground & Roof Rigger Sprites
    // # -------------------------------------------------------------
    if (this.crewState === 'GROUND_RIGGING') {
      const riggerX = pickupBayX + 16;
      const riggerY = groundY;

      // Draw Rigger Figure (Hardhat, Hi-Vis Orange Vest, Navy Pants)
      ctx.fillStyle = '#eab308'; // Hardhat
      ctx.beginPath();
      ctx.arc(riggerX, riggerY - 26, 4, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#f97316'; // Hi-vis vest
      ctx.fillRect(riggerX - 4, riggerY - 22, 8, 11);

      // Silver reflective safety stripe
      ctx.fillStyle = '#e2e8f0';
      ctx.fillRect(riggerX - 4, riggerY - 17, 8, 2);

      ctx.fillStyle = '#1e293b'; // Navy pants
      ctx.fillRect(riggerX - 3, riggerY - 11, 3, 11);
      ctx.fillRect(riggerX + 1, riggerY - 11, 3, 11);

      // Rigging arms reaching toward load hook
      ctx.strokeStyle = '#f97316';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(riggerX - 4, riggerY - 20);
      ctx.lineTo(riggerX - 12, riggerY - 26);
      ctx.stroke();

      // Rigger Status Badge
      const pct = Math.min(100, Math.round((this.crewTimer / this.crewDuration) * 100));
      ctx.fillStyle = '#f97316';
      ctx.font = 'bold 8px system-ui';
      ctx.textAlign = 'center';
      ctx.fillText(`👷 RIGGER ATTACHING SLING (${pct}%)`, riggerX - 10, riggerY - 34);
    } else if (this.crewState === 'ROOF_UNRIGGING' && currentLoad) {
      const targetSlabY = meterToY(currentLoad.target.heightM);
      const riggerX = scaleX(currentLoad.target.radiusM) + 18;
      const riggerY = targetSlabY - 3;

      // Draw Roof Crew Worker
      ctx.fillStyle = '#eab308'; // Hardhat
      ctx.beginPath();
      ctx.arc(riggerX, riggerY - 26, 4, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#06b6d4'; // Cyan landing crew jacket
      ctx.fillRect(riggerX - 4, riggerY - 22, 8, 11);

      ctx.fillStyle = '#e2e8f0'; // Silver reflective stripe
      ctx.fillRect(riggerX - 4, riggerY - 17, 8, 2);

      ctx.fillStyle = '#1e293b'; // Work pants
      ctx.fillRect(riggerX - 3, riggerY - 11, 3, 11);
      ctx.fillRect(riggerX + 1, riggerY - 11, 3, 11);

      // Status Badge
      const pct = Math.min(100, Math.round((this.crewTimer / this.crewDuration) * 100));
      ctx.fillStyle = '#06b6d4';
      ctx.font = 'bold 8px system-ui';
      ctx.textAlign = 'center';
      ctx.fillText(`🏗️ ROOF CREW UNHOOKING (${pct}%)`, riggerX, riggerY - 34);
    }

    // # -------------------------------------------------------------
    // # Strict Rigger Safety Breach Emergency Overlay Banner
    // # -------------------------------------------------------------
    if (this.crewBreachTimer > 0) {
      const bannerW = Math.min(380, width - 40);
      const bannerH = 46;
      const bannerX = x + (width - bannerW) / 2;
      const bannerY = y + 50;

      ctx.fillStyle = 'rgba(185, 28, 28, 0.95)';
      ctx.strokeStyle = '#fca5a5';
      ctx.lineWidth = 2.5;
      ctx.fillRect(bannerX, bannerY, bannerW, bannerH);
      ctx.strokeRect(bannerX, bannerY, bannerW, bannerH);

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 11px system-ui';
      ctx.textAlign = 'center';
      ctx.fillText('⚠️ RIGGER SAFETY BREACH: CONTROLS MOVED DURING RIGGING!', bannerX + bannerW / 2, bannerY + 18);
      ctx.fillStyle = '#fef08a';
      ctx.font = '10px monospace';
      ctx.fillText('-15% SAFETY PILLAR PENALTY APPLIED (LOLER PROHIBITION)', bannerX + bannerW / 2, bannerY + 34);
    }

    // Panel Header Badge
    ctx.textAlign = 'left';
    ctx.fillStyle = '#f8fafc';
    ctx.font = 'bold 11px system-ui';
    ctx.fillText('SIDE-ELEVATION HEIGHT GAUGE (6-STORY HIGH-RISE)', x + 16, y + 22);
    ctx.fillStyle = '#94a3b8';
    ctx.font = '10px monospace';
    ctx.fillText(`HOOK HEIGHT: ${this.hookElevationM.toFixed(1)}m | CABLE L: ${this.cableLengthM.toFixed(1)}m | MAST: 36m`, x + 16, y + 36);
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
    const waveW = Math.max(10, width - 20);
    const waveH = Math.max(10, height - 24);

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

  // # Function: Reset Kinematics to Initial Datum & Multi-Load State
  resetPositions() {
    this.slewAngleDeg = 45.0;
    this.trolleyRadiusM = 16.0;
    this.hookElevationM = 8.0;
    this.cableLengthM = 28.0;
    this.pendulumRadialDeg = 0.0;
    this.pendulumRadialVel = 0.0;
    this.pendulumTangentialDeg = 0.0;
    this.pendulumTangentialVel = 0.0;
    this.totalSwayAngleDeg = 0.0;
    this.filteredJerk = 0.0;
    this.isEmergencyStopped = false;

    // # Tenstar Multi-Load & Crew State Reset
    this.hasLoad = false;
    this.currentLoadIndex = 0;
    this.deliveredLoads = [];
    this.crewState = 'IDLE';
    this.crewTimer = 0.0;
    this.crewSafetyBreach = false;
    this.crewBreachMessage = '';
    this.crewBreachTimer = 0.0;
    this.magnetEngaged = false;
    this.updateCallingButtonsDOM();
  }
}

// # State Block: Instantiate Singleton Global Physics Engine Instance & Export Configuration
if (typeof window !== 'undefined') {
  window.CRANE_PHYSICS_CONFIG = CRANE_PHYSICS_CONFIG;
  window.CranePhysics = new CranePhysicsEngine();
}
