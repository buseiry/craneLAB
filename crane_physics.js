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
  MAX_SLEW_SPEED_DEG: 6.0,            // # Maximum slewing angular velocity in deg/s (~1.0 RPM - smooth, realistic displacement rate)
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

  // # State Block: Multi-Load Tenstar Exercise 2.1 Payloads (Strict Ground 0m to Building Apex 24m)
  LOADS: [
    {
      id: 'LOAD_1_REBAR',
      name: 'Steel Rebar Bundle',
      massTonnes: 2.4,
      color: '#38bdf8',
      pickupHeightM: 0.0,
      pickup: { radiusM: 16.0, angleDeg: 45.0, heightM: 0.0 },
      target: {
        floor: 'Building Apex Roof Deck (24m)',
        radiusM: 30.0,
        angleDeg: 135.0,
        heightM: 24.0,                    // # Building Apex Top Roof Deck (24.0m)
        toleranceRadiusM: 2.5,
        toleranceAngleDeg: 8.0,
        toleranceHeightM: 2.2
      }
    },
    {
      id: 'LOAD_2_PRECAST_BEAM',
      name: 'Precast Concrete I-Beam',
      massTonnes: 3.5,
      color: '#fbbf24',
      pickupHeightM: 0.0,
      pickup: { radiusM: 16.0, angleDeg: 45.0, heightM: 0.0 },
      target: {
        floor: 'Building Apex Roof Deck (24m)',
        radiusM: 32.0,
        angleDeg: 145.0,
        heightM: 24.0,                    // # Building Apex Top Roof Deck (24.0m)
        toleranceRadiusM: 2.5,
        toleranceAngleDeg: 8.0,
        toleranceHeightM: 2.2
      }
    },
    {
      id: 'LOAD_3_HVAC_CHILLER',
      name: 'Rooftop Industrial Chiller',
      massTonnes: 2.8,
      color: '#c084fc',
      pickupHeightM: 0.0,
      pickup: { radiusM: 16.0, angleDeg: 45.0, heightM: 0.0 },
      target: {
        floor: 'Building Apex Roof Deck (24m)',
        radiusM: 28.0,
        angleDeg: 125.0,
        heightM: 24.0,                    // # Building Apex Top Roof Deck (24.0m)
        toleranceRadiusM: 2.5,
        toleranceAngleDeg: 8.0,
        toleranceHeightM: 2.2
      }
    }
  ],

  // # State Block: Target Zone (Building Apex Top Roof Deck at 24.0m)
  TARGET_ZONE: {
    name: 'Building Apex Roof Deck (Top of Building 24m)',
    radiusM: 30.0,
    angleDeg: 135.0,
    heightM: 24.0,
    toleranceRadiusM: 2.5,
    toleranceAngleDeg: 8.0,
    toleranceHeightM: 2.2
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

  // # State Block: High-Rise Building Floors (Ground 0m to Building Apex Top Roof Deck 24.0m)
  BUILDING_HEIGHT_M: 24.0,
  BUILDING_FLOORS: [
    { name: 'Ground Floor', heightM: 0.0, slabThicknessM: 0.6, color: '#475569', label: 'GF (0m)' },
    { name: '1st Floor', heightM: 4.0, slabThicknessM: 0.4, color: '#334155', label: '1F (4m)' },
    { name: '2nd Floor', heightM: 8.0, slabThicknessM: 0.4, color: '#334155', label: '2F (8m)' },
    { name: '3rd Floor', heightM: 12.0, slabThicknessM: 0.4, color: '#334155', label: '3F (12m)' },
    { name: '4th Floor', heightM: 16.0, slabThicknessM: 0.4, color: '#334155', label: '4F (16m)' },
    { name: '5th Floor Slab', heightM: 20.0, slabThicknessM: 0.6, color: '#334155', label: '5F (20m)' },
    { name: 'Building Apex Roof Deck', heightM: 24.0, slabThicknessM: 0.8, color: '#10b981', label: 'Apex Roof (24m)' }
  ],

  // # State Block: Side Elevation Obstacles & Scaffolding Floors
  OBSTACLES: [
    { name: 'Ground Floor Logistics Bay', baseHeightM: 0.0, topHeightM: 1.0, minRM: 10.0, maxRM: 45.0, color: '#334155' },
    { name: 'Floors 1-5 Building Facade', baseHeightM: 1.0, topHeightM: 20.0, minRM: 24.0, maxRM: 38.0, color: '#475569' },
    { name: 'Building Apex Roof Target Deck', baseHeightM: 20.0, topHeightM: 24.0, minRM: 26.0, maxRM: 36.0, color: '#10b981' }
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
    this.showRadarMap = false;         // # Circular map direction hidden by default so daylight construction site expands to full panoramic width
    this.hideFigures = true;           // # Hide telemetry figures by default for maximum visual space on mobile
    this.wasInPickupPosition = false;  // # Edge trigger for slinger voice alert on 4-axis alignment
    this.wasInDropPosition = false;    // # Edge trigger for roof slinger voice alert on 4-axis alignment
    this.hasAnnouncedDropPoint = false; // # Edge trigger for "Drop your load!" voice readout at drop coordinates
    this.lastProximityPingTime = 0;     // # Timestamp of last proximity radar audio ping (accelerates near target)

    // # State Block: 3D Camera Controls State
    this.cameraMode = 'ORBIT_3D';      // # 'ORBIT_3D' | 'CAB_POV' | 'HOOK_CAM' | 'RIGGER_POV'
    this.cameraYaw = 0.85;             // # Horizontal orbit azimuth (radians)
    this.cameraPitch = 0.42;           // # Vertical orbit elevation (radians)
    this.cameraDistance = 65.0;        // # Orbit distance from center (meters)
    this.cameraTarget = [12.0, 16.0, 6.0]; // # 3D look-at target [X, Y, Z]
    this.isDraggingCamera = false;
    this.lastMousePos = { x: 0, y: 0 };
    this.audioCtx = null;
    this.toastTimeout = null;

    // # State Block: Input Device States (Touch + Keyboard)
    this.keyboardKeys = {};
    this.canvas = null;
    this.ctx = null;
    this.lastFrameTime = performance.now();
  }

  // # Function: Toggle Telemetry Figures & Numbers for Mobile Visual Space
  toggleFigures() {
    this.hideFigures = !this.hideFigures;
    const cockpit = document.querySelector('.simulator-cockpit');
    if (cockpit) {
      cockpit.classList.toggle('figures-hidden', this.hideFigures);
    }
    const btn = document.getElementById('btn-toggle-figures');
    if (btn) {
      btn.innerHTML = this.hideFigures ? '📊 Figures: Hidden' : '📊 Figures: Visible';
    }
    this.showToast(this.hideFigures ? '📊 Figures hidden — Maximum space for crane & controls' : '📊 Figures visible');
    return this.hideFigures;
  }

  // # Function: Initialize Physics Subsystem and Bind Event Listeners
  init(canvasElement) {
    this.canvas = canvasElement;
    if (this.canvas) {
      this.ctx = this.canvas.getContext('2d');
      this.setupCameraListeners(this.canvas);
    }

    // # State Block: Initialize Keyboard Input Listeners (WASD + Arrow Keys Fallback)
    this.setupKeyboardListeners();

    // # State Block: Reset Timestamp Clock
    this.lastFrameTime = performance.now();
    console.log('[CranePhysics] 3D Crane Digital Twin Engine Initialized');
  }

  // # Function: Setup 3D Camera Orbit and Touch Drag Listeners
  setupCameraListeners(canvas) {
    if (!canvas) return;

    canvas.addEventListener('mousedown', (e) => {
      this.isDraggingCamera = true;
      this.lastMousePos = { x: e.clientX, y: e.clientY };
    });

    window.addEventListener('mousemove', (e) => {
      if (!this.isDraggingCamera) return;
      if (this.cameraMode !== 'ORBIT_3D') return;

      const dx = e.clientX - this.lastMousePos.x;
      const dy = e.clientY - this.lastMousePos.y;
      this.cameraYaw -= dx * 0.007;
      this.cameraPitch = Math.max(0.05, Math.min(Math.PI / 2 - 0.05, this.cameraPitch + dy * 0.007));
      this.lastMousePos = { x: e.clientX, y: e.clientY };
    });

    window.addEventListener('mouseup', () => {
      this.isDraggingCamera = false;
    });

    canvas.addEventListener('wheel', (e) => {
      if (this.cameraMode === 'ORBIT_3D') {
        e.preventDefault();
        this.cameraDistance = Math.max(15.0, Math.min(140.0, this.cameraDistance + e.deltaY * 0.06));
      }
    }, { passive: false });

    // Touch events for mobile 3D orbit
    canvas.addEventListener('touchstart', (e) => {
      if (e.touches.length === 1) {
        this.isDraggingCamera = true;
        this.lastMousePos = { x: e.touches[0].clientX, y: e.touches[0].clientY };
      }
    }, { passive: true });

    canvas.addEventListener('touchmove', (e) => {
      if (!this.isDraggingCamera || e.touches.length !== 1) return;
      if (this.cameraMode !== 'ORBIT_3D') return;

      const dx = e.touches[0].clientX - this.lastMousePos.x;
      const dy = e.touches[0].clientY - this.lastMousePos.y;
      this.cameraYaw -= dx * 0.007;
      this.cameraPitch = Math.max(0.05, Math.min(Math.PI / 2 - 0.05, this.cameraPitch + dy * 0.007));
      this.lastMousePos = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    }, { passive: true });

    canvas.addEventListener('touchend', () => {
      this.isDraggingCamera = false;
    }, { passive: true });
  }

  // # Function: Cycle through available 3D Camera Views
  cycleCameraMode() {
    const modes = ['ORBIT_3D', 'CAB_POV', 'HOOK_CAM', 'RIGGER_POV'];
    const idx = modes.indexOf(this.cameraMode);
    this.cameraMode = modes[(idx + 1) % modes.length];
    this.playBeep(700, 0.08);

    const tag = document.getElementById('hud-camera-mode-tag');
    if (tag) {
      tag.textContent = this.cameraMode.replace('_', ' ');
    }
    this.showToast(`3D Camera View: ${this.cameraMode.replace('_', ' ')}`);
  }

  // # Function: Synthesize Tactical Feedback Audio Beep via Web Audio API
  playBeep(freq = 600, duration = 0.1) {
    try {
      if (typeof window === 'undefined') return;
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      if (!this.audioCtx) this.audioCtx = new AudioCtx();
      if (this.audioCtx.state === 'suspended') this.audioCtx.resume();

      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, this.audioCtx.currentTime);
      gain.gain.setValueAtTime(0.15, this.audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.audioCtx.currentTime + duration);

      osc.connect(gain);
      gain.connect(this.audioCtx.destination);
      osc.start();
      osc.stop(this.audioCtx.currentTime + duration);
    } catch (e) {
      // Audio autoplay policy handled silently
    }
  }

  // # Function: Display temporary visual toast banner on Cockpit HUD
  showToast(message) {
    if (typeof document === 'undefined') return;
    try {
      let toast = document.getElementById('crane-action-toast');
      if (!toast) {
        toast = document.createElement('div');
        toast.id = 'crane-action-toast';
        toast.className = 'crane-action-toast';
        const deck = document.querySelector('.viewport-deck') || document.body;
        if (deck && typeof deck.appendChild === 'function') {
          deck.appendChild(toast);
        }
      }
      if (toast) {
        toast.textContent = message;
        toast.style.display = 'block';
        if (this.toastTimeout) clearTimeout(this.toastTimeout);
        this.toastTimeout = setTimeout(() => {
          if (toast) toast.style.display = 'none';
        }, 3200);
      }
    } catch (e) {
      console.warn('[CranePhysics] showToast error:', e);
    }
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
      // # Slew Angle Integration: Progressive rate-of-displacement inertial acceleration
      // # Prevents violent tangential load displacement and provides realistic industrial tower crane feel
      const targetSlewVelocity = this.currentInputVector.slew * CRANE_PHYSICS_CONFIG.MAX_SLEW_SPEED_DEG;
      const slewRampRate = 3.2; // deg/s² progressive smooth slew acceleration ramp
      const slewSmoothing = Math.min(1.0, slewRampRate * dt);
      this.slewVelocityDeg += (targetSlewVelocity - this.slewVelocityDeg) * slewSmoothing;
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
            if (typeof window !== 'undefined' && window.CraneVoiceInstructor) {
              window.CraneVoiceInstructor.speak(
                "Payload hooked! Hoist cable up, then slew right toward the building apex at 24 meters.",
                'load_hooked',
                0,
                true
              );
            }
          } else if (this.crewState === 'ROOF_UNRIGGING') {
            this.hasLoad = false;
            const currentLoad = CRANE_PHYSICS_CONFIG.LOADS[this.currentLoadIndex];
            if (currentLoad) {
              this.deliveredLoads.push({
                ...currentLoad,
                deliveredAt: Date.now(),
                landingFloor: currentLoad.target.floor,
                deliveredRadiusM: this.trolleyRadiusM,
                deliveredHeightM: currentLoad.target.heightM
              });
              this.currentLoadIndex++;
            }
            this.crewState = 'IDLE';
            this.crewTimer = 0.0;

            if (typeof window !== 'undefined' && window.CraneVoiceInstructor) {
              window.CraneVoiceInstructor.speak(
                "Payload delivered safely to the building apex! Hoist hook up and return to ground pickup bay.",
                'delivery_complete',
                0,
                true
              );
            }

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
    // # 6B. Drop Point Signal & Spoken "Drop your load!" Arrival Readout
    // # -------------------------------------------------------------
    if (this.hasLoad && this.crewState === 'IDLE') {
      if (this.isHookAtDropCoordinates()) {
        if (!this.hasAnnouncedDropPoint) {
          this.hasAnnouncedDropPoint = true;
          // # Play prominent two-tone arrival chime (880Hz -> 1174Hz harmonic ping)
          this.playBeep(880, 0.15);
          setTimeout(() => this.playBeep(1174, 0.28), 160);

          // # Spoken voice readout immediately announces: "Drop your load!"
          if (typeof window !== 'undefined' && window.CraneVoiceInstructor) {
            window.CraneVoiceInstructor.speak("Drop your load!", 'drop_point', 3, true);
          }
          this.showToast('🎯 EXACT DROP POINT: Drop your load now! Hold controls neutral to call slinger.');
        }
      } else {
        this.hasAnnouncedDropPoint = false;

        // # Accelerating proximity sonar audio pings as operator approaches target deck (< 7.0m)
        if (this.isNearDropPoint()) {
          const now = performance.now();
          if (!this.lastProximityPingTime) this.lastProximityPingTime = 0;
          const currentLoad = CRANE_PHYSICS_CONFIG.LOADS[this.currentLoadIndex] || CRANE_PHYSICS_CONFIG.LOADS[0];
          const tz = currentLoad.target;
          const dR = Math.abs(this.trolleyRadiusM - tz.radiusM);
          const dTheta = Math.abs(this.shortestAngleDiff(this.slewAngleDeg, tz.angleDeg));
          const closeness = Math.max(0, 1 - (dR / 7.0 + dTheta / 30.0) / 2);
          const pingInterval = 1100 - closeness * 850; // 250ms (closest) to 1100ms (far)
          if (now - this.lastProximityPingTime > pingInterval) {
            this.lastProximityPingTime = now;
            this.playBeep(480 + closeness * 320, 0.05);
          }
        }
      }
    } else {
      this.hasAnnouncedDropPoint = false;
    }

    // # -------------------------------------------------------------
    // # 7. Synchronize DOM Telemetry HUD Elements & Calling Buttons
    // # -------------------------------------------------------------
    this.updateDomHUD(swlPercent, currentMomentKnm);
    this.updateCallingButtonsDOM();

    // # -------------------------------------------------------------
    // # 8. Spoken Virtual Voice Instructor Situational Update
    // # -------------------------------------------------------------
    if (typeof window !== 'undefined' && window.CraneVoiceInstructor) {
      window.CraneVoiceInstructor.update(this);
    }
  }

  // # Function: Get current active suspended payload mass in metric tonnes
  getCurrentPayloadMass() {
    if (!this.hasLoad) return 0.0; // Hook tare block mass treated as machinery constant
    const load = CRANE_PHYSICS_CONFIG.LOADS[this.currentLoadIndex];
    return load ? load.massTonnes : 0.0;
  }

  // # -------------------------------------------------------------
  // # SECTION: STRICT 4-AXIS SLINGER POSITION INTERLOCK SUBSYSTEM
  // # -------------------------------------------------------------

  // # Function: Calculate shortest signed angular difference (-180 to +180 deg)
  shortestAngleDiff(a, b) {
    let diff = (a - b) % 360;
    if (diff > 180) diff -= 360;
    if (diff < -180) diff += 360;
    return diff;
  }

  // # -------------------------------------------------------------
  // # SECTION: STRICT 4-AXIS SLINGER POSITION INTERLOCK SUBSYSTEM (Part 4)
  // # -------------------------------------------------------------

  // # Function: Real-time Ground Slinger Delta Corrections
  getGroundSlingerDelta() {
    const pickupR = 16.0;
    const pickupTheta = 45.0;
    const targetHookH = 1.5;

    const dR = pickupR - this.trolleyRadiusM;
    const dTheta = this.shortestAngleDiff(pickupTheta, this.slewAngleDeg);
    const dH = this.hookElevationM - targetHookH;

    const parts = [];
    parts.push(`Trolley ${dR >= 0 ? '+' : ''}${dR.toFixed(1)}m`);
    parts.push(`Slew ${dTheta >= 0 ? '+' : ''}${dTheta.toFixed(0)}°`);
    parts.push(dH > 0 ? `Lower ${dH.toFixed(1)}m` : `Raise ${Math.abs(dH).toFixed(1)}m`);

    const text = `🔒 Slinger Locked — Need: ${parts.join(' | ')}`;
    const voice = `Ground slinger locked. Adjust trolley by ${Math.abs(dR).toFixed(1)} meters ${dR >= 0 ? 'out' : 'in'}, slew by ${Math.abs(dTheta).toFixed(0)} degrees, and ${dH > 0 ? 'lower' : 'raise'} hook by ${Math.abs(dH).toFixed(1)} meters.`;
    const toast = `🔒 Slinger Locked: Trolley ${dR >= 0 ? '+' : ''}${dR.toFixed(1)}m | Slew ${dTheta >= 0 ? '+' : ''}${dTheta.toFixed(0)}° | Hook ${dH > 0 ? '-' + dH.toFixed(1) + 'm' : '+' + Math.abs(dH).toFixed(1) + 'm'}`;

    return { dR, dTheta, dH, text, voice, toast };
  }

  // # Function: Real-time Building Apex Slinger Delta Corrections
  getApexSlingerDelta() {
    const currentLoad = CRANE_PHYSICS_CONFIG.LOADS[this.currentLoadIndex] || CRANE_PHYSICS_CONFIG.LOADS[0];
    const targetDrop = currentLoad.target;
    const dropR = targetDrop.radiusM;
    const dropTheta = targetDrop.angleDeg;
    const dropH = 24.0;

    const dR = dropR - this.trolleyRadiusM;
    const dTheta = this.shortestAngleDiff(dropTheta, this.slewAngleDeg);
    const dH = dropH - this.hookElevationM;

    const parts = [];
    parts.push(`Trolley ${dR >= 0 ? '+' : ''}${dR.toFixed(1)}m`);
    parts.push(`Slew ${dTheta >= 0 ? '+' : ''}${dTheta.toFixed(0)}°`);
    parts.push(dH > 0 ? `Hoist ${dH.toFixed(1)}m` : `Lower ${Math.abs(dH).toFixed(1)}m`);

    const text = `🔒 Slinger Locked — Need: ${parts.join(' | ')}`;
    const voice = `Building apex slinger locked. Adjust trolley by ${Math.abs(dR).toFixed(1)} meters ${dR >= 0 ? 'out' : 'in'}, slew by ${Math.abs(dTheta).toFixed(0)} degrees, and ${dH > 0 ? 'hoist' : 'lower'} hook to 24 meters.`;
    const toast = `🔒 Slinger Locked: Trolley ${dR >= 0 ? '+' : ''}${dR.toFixed(1)}m | Slew ${dTheta >= 0 ? '+' : ''}${dTheta.toFixed(0)}° | Hook ${dH > 0 ? '+' + dH.toFixed(1) + 'm' : '-' + Math.abs(dH).toFixed(1) + 'm'}`;

    return { dR, dTheta, dH, text, voice, toast };
  }

  // # STRICT 4-AXIS PICKUP POSITION CHECK (GROUND SLINGER):
  // # Returns true ONLY when ALL 5 conditions are satisfied:
  // # 1) !this.hasLoad
  // # 2) Radial error <= 2.5m (Pickup Bay R = 16.0m)
  // # 3) Slew angle error <= 8.0 deg (Pickup Bay Theta = 45.0 deg)
  // # 4) Hook height between 0.2m and 3.0m
  // # 5) Pendulum sway <= 3.5 deg AND joysticks neutral
  isHookInPickupPosition() {
    if (this.hasLoad) return false;

    // 2. Radial error <= 2.5m
    const radialError = Math.abs(this.trolleyRadiusM - 16.0);
    if (radialError > 2.5) return false;

    // 3. Slew angle error <= 8.0 deg
    const angleError = Math.abs(this.shortestAngleDiff(this.slewAngleDeg, 45.0));
    if (angleError > 8.0) return false;

    // 4. Hook height: 0.2m <= hookElevationM <= 3.0m
    if (this.hookElevationM < 0.2 || this.hookElevationM > 3.0) return false;

    // 5. Pendulum sway <= 3.5 deg
    const swayMag = Math.hypot(this.pendulumRadialDeg, this.pendulumTangentialDeg);
    if (swayMag > 3.5) return false;

    // Joysticks neutral
    const isNeutral = (
      Math.abs(this.currentInputVector.slew) < 0.08 &&
      Math.abs(this.currentInputVector.trolley) < 0.08 &&
      Math.abs(this.currentInputVector.hoist) < 0.08
    );
    if (!isNeutral) return false;

    return true;
  }

  // # STRICT 4-AXIS RELEASE POSITION CHECK (BUILDING APEX SLINGER):
  // # Returns true ONLY when ALL 5 conditions are satisfied:
  // # 1) this.hasLoad === true
  // # 2) Radial error <= 2.5m (Target Apex R)
  // # 3) Slew angle error <= 8.0 deg (Target Apex Theta)
  // # 4) Apex height alignment: Math.abs(hookElevationM - 24.0) <= 2.2m (24.0m Building Apex Roof Deck)
  // # 5) Pendulum sway <= 3.5 deg AND joysticks neutral
  isHookInDropPosition() {
    if (!this.hasLoad) return false;

    const currentLoad = CRANE_PHYSICS_CONFIG.LOADS[this.currentLoadIndex] || CRANE_PHYSICS_CONFIG.LOADS[0];
    const targetDrop = currentLoad.target;

    // 2. Radial error <= 2.5m
    const radialError = Math.abs(this.trolleyRadiusM - targetDrop.radiusM);
    if (radialError > 2.5) return false;

    // 3. Slew angle error <= 8.0 deg
    const angleError = Math.abs(this.shortestAngleDiff(this.slewAngleDeg, targetDrop.angleDeg));
    if (angleError > 8.0) return false;

    // 4. Apex height alignment directly at 24.0m building roof deck
    const heightError = Math.abs(this.hookElevationM - 24.0);
    if (heightError > 2.2) return false;

    // 5. Pendulum sway <= 3.5 deg
    const swayMag = Math.hypot(this.pendulumRadialDeg, this.pendulumTangentialDeg);
    if (swayMag > 3.5) return false;

    // Joysticks neutral
    const isNeutral = (
      Math.abs(this.currentInputVector.slew) < 0.08 &&
      Math.abs(this.currentInputVector.trolley) < 0.08 &&
      Math.abs(this.currentInputVector.hoist) < 0.08
    );
    if (!isNeutral) return false;

    return true;
  }

  // # Backward-compatible aliases
  isHookWithinTargetFloor() {
    return this.isHookInDropPosition();
  }

  isHookAtDropCoordinates() {
    return this.isHookInDropPosition();
  }

  isHookInPickupBay() {
    return this.isHookInPickupPosition();
  }

  isHookInTargetZone() {
    return this.isHookInDropPosition();
  }

  // # Function: Evaluate whether hook with load is approaching drop target zone
  isNearDropPoint() {
    if (!this.hasLoad) return false;
    const currentLoad = CRANE_PHYSICS_CONFIG.LOADS[this.currentLoadIndex] || CRANE_PHYSICS_CONFIG.LOADS[0];
    const targetDrop = currentLoad.target;

    const radialError = Math.abs(this.trolleyRadiusM - targetDrop.radiusM);
    const slewError = Math.abs(this.shortestAngleDiff(this.slewAngleDeg, targetDrop.angleDeg));
    const heightError = Math.abs(this.hookElevationM - 24.0);

    return (radialError <= 8.0 && slewError <= 25.0 && heightError <= 5.0);
  }

  // # Function: User triggers "Call Ground Slinger" (Attach Slings to Payload)
  callGroundCrew() {
    // 1. Shift completion check
    if (this.currentLoadIndex >= CRANE_PHYSICS_CONFIG.LOADS.length) {
      this.currentLoadIndex = 0;
      this.deliveredLoads = [];
      this.hasLoad = false;
      this.showToast('Starting a new Tenstar lifting shift at the ground pickup bay!');
      this.updateCallingButtonsDOM();
      return { success: true };
    }

    // 2. Already carrying check
    if (this.hasLoad) {
      this.playBeep(240, 0.25);
      this.showToast('Hook is already carrying a payload! Slew toward the building apex at 24m.');
      if (typeof window !== 'undefined' && window.CraneVoiceInstructor) {
        window.CraneVoiceInstructor.speak('You are already carrying a payload. Hoist above 24 meters and slew toward the building apex.', 'info', 0, true);
      }
      return { success: false, reason: 'Already carrying load' };
    }

    const currentLoad = CRANE_PHYSICS_CONFIG.LOADS[this.currentLoadIndex] || CRANE_PHYSICS_CONFIG.LOADS[0];
    const isMagnet = (this.riggingMode === 'ELECTRO_MAGNET' || this.riggingMode === 'MAGNET');

    // # 3. Strict 4-Axis Position Check
    if (this.isHookInPickupPosition()) {
      // Start 1.8-second animated rigging process
      this.crewState = 'GROUND_RIGGING';
      this.crewTimer = 0.0;
      this.crewDuration = 1.8;
      this.crewSafetyBreach = false;
      this.playBeep(880, 0.25);

      const msg = isMagnet
        ? `🧲 Electro-Magnet Clamping: ${currentLoad.name}... Hold controls steady!`
        : `👷 Ground Slinger Rigging: Attaching 4-leg slings to ${currentLoad.name}... Hold controls steady!`;
      this.showToast(msg);

      if (typeof window !== 'undefined' && window.CraneVoiceInstructor) {
        window.CraneVoiceInstructor.speak(
          isMagnet
            ? "Electro-magnet is energizing. Hold crane controls steady!"
            : "Ground slinger is attaching four-leg slings. Keep crane controls neutral!",
          'rigging',
          0,
          true
        );
      }
      this.updateCallingButtonsDOM();
      return { success: true };
    } else {
      // Out of position: Read out required corrections via Voice Instructor
      this.playBeep(240, 0.3);
      const delta = this.getGroundSlingerDelta();
      this.showToast(delta.toast);

      if (typeof window !== 'undefined' && window.CraneVoiceInstructor) {
        window.CraneVoiceInstructor.speak(delta.voice, 'slinger_locked', 0, true);
      }
      this.updateCallingButtonsDOM();
      return { success: false, reason: 'Ground slinger interlock locked' };
    }
  }

  // # Function: User triggers "Call Building Apex Slinger" (Release Load at Roof)
  callRoofCrew() {
    // 1. Must be carrying load
    if (!this.hasLoad) {
      this.playBeep(240, 0.25);
      this.showToast('Hook is empty! Lower hook to Ground Pickup Bay to hook a payload first.');
      if (typeof window !== 'undefined' && window.CraneVoiceInstructor) {
        window.CraneVoiceInstructor.speak('Hook is empty. Slew to the ground pickup bay to hook a payload first.', 'info', 0, true);
      }
      return { success: false, reason: 'No load' };
    }

    const currentLoad = CRANE_PHYSICS_CONFIG.LOADS[this.currentLoadIndex] || CRANE_PHYSICS_CONFIG.LOADS[0];
    if (!currentLoad) return { success: false, reason: 'No current load' };
    const isMagnet = (this.riggingMode === 'ELECTRO_MAGNET' || this.riggingMode === 'MAGNET');

    // # 2. Strict 4-Axis Position Check at Building Apex (24m)
    if (this.isHookInDropPosition()) {
      // Start 1.8-second animated unrigging process
      this.crewState = 'ROOF_UNRIGGING';
      this.crewTimer = 0.0;
      this.crewDuration = 1.8;
      this.crewSafetyBreach = false;
      this.playBeep(880, 0.25);

      const msg = isMagnet
        ? `🧲 Electro-Magnet De-Energizing on Building Apex Roof Deck... Hold controls steady!`
        : `🏗️ Building Apex Slinger Unhooking: Detaching 4-leg slings from ${currentLoad.name}... Hold controls steady!`;
      this.showToast(msg);

      if (typeof window !== 'undefined' && window.CraneVoiceInstructor) {
        window.CraneVoiceInstructor.speak(
          isMagnet
            ? "De-energizing magnet onto the roof deck. Keep crane controls neutral!"
            : "Building apex slinger is unhooking the slings on the roof deck. Keep crane controls neutral!",
          'unrigging',
          0,
          true
        );
      }
      this.updateCallingButtonsDOM();
      return { success: true };
    } else {
      // Out of position: Read out required corrections via Voice Instructor
      this.playBeep(240, 0.3);
      const delta = this.getApexSlingerDelta();
      this.showToast(delta.toast);

      if (typeof window !== 'undefined' && window.CraneVoiceInstructor) {
        window.CraneVoiceInstructor.speak(delta.voice, 'slinger_locked', 0, true);
      }
      this.updateCallingButtonsDOM();
      return { success: false, reason: 'Building apex slinger interlock locked' };
    }
  }

  // # Function: Toggle between Hook Crew Rigging and Electro-Magnet Mode
  toggleRiggingMode() {
    this.riggingMode = (this.riggingMode === 'ELECTRO_MAGNET' || this.riggingMode === 'MAGNET') ? 'HOOK' : 'MAGNET';
    this.playBeep(640, 0.15);
    this.showToast(this.riggingMode === 'MAGNET' ? 'Rigging Mode: Electro-Magnet' : 'Rigging Mode: Hook & 4-Leg Slings');
    this.updateCallingButtonsDOM();
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
        dropStatusTag.textContent = 'SAFETY BREACH: CONTROLS MOVED DURING RIGGING!';
        dropStatusTag.style.color = 'var(--safety-red)';
        dropStatusTag.style.borderColor = 'var(--safety-red)';
      } else if (this.crewState === 'GROUND_RIGGING') {
        dropStatusTag.textContent = 'GROUND RIGGER ATTACHING SLING (HOLD CONTROLS NEUTRAL)';
        dropStatusTag.style.color = 'var(--safety-amber)';
        dropStatusTag.style.borderColor = 'var(--safety-amber)';
      } else if (this.crewState === 'ROOF_UNRIGGING') {
        dropStatusTag.textContent = 'ROOF CREW DETACHING SLING (HOLD CONTROLS NEUTRAL)';
        dropStatusTag.style.color = 'var(--safety-cyan)';
        dropStatusTag.style.borderColor = 'var(--safety-cyan)';
      } else if (this.isInExclusionZone) {
        dropStatusTag.textContent = `VIOLATION: ${this.activeExclusionName}`;
        dropStatusTag.style.color = 'var(--safety-red)';
        dropStatusTag.style.borderColor = 'var(--safety-red)';
      } else if (this.isOnTarget) {
        const floorName = currentLoad ? currentLoad.target.floor : 'TARGET SLAB';
        dropStatusTag.textContent = `TARGET ${floorName.toUpperCase()} REACHED (STABILIZED - READY FOR UNHOOK)`;
        dropStatusTag.style.color = 'var(--safety-emerald)';
        dropStatusTag.style.borderColor = 'var(--safety-emerald)';
      } else if (!this.hasLoad) {
        if (this.isAtPickupBay) {
          dropStatusTag.textContent = 'IN PICKUP ZONE: READY TO CALL GROUND CREW';
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

  // # Function: Synchronize Floating Calling Buttons on HUD with strict 4-axis interlock & live deltas
  updateCallingButtonsDOM() {
    const btnGround = document.getElementById('btn-call-ground-crew');
    const btnRoof = document.getElementById('btn-call-roof-crew');
    const btnMagnet = document.getElementById('btn-toggle-magnet');
    const hintGround = document.getElementById('hint-ground-crew');
    const hintRoof = document.getElementById('hint-roof-crew');

    const isMagnet = this.riggingMode === 'ELECTRO_MAGNET' || this.riggingMode === 'MAGNET';

    // Rigging mode button text (Tactile Industrial Switch)
    if (btnMagnet) {
      btnMagnet.innerHTML = isMagnet
        ? `<span>🧲 Mode: <strong>Electro-Magnet</strong> (Click for Hook)</span>`
        : `<span>🪝 Mode: <strong>Hook &amp; Slings</strong> (Click for Magnet)</span>`;
      btnMagnet.style.borderColor = isMagnet ? 'var(--safety-cyan)' : 'var(--safety-amber)';
    }

    const currentLoad = CRANE_PHYSICS_CONFIG.LOADS[this.currentLoadIndex] || CRANE_PHYSICS_CONFIG.LOADS[0];

    // # -------------------------------------------------------------
    // # GROUND SLINGER BUTTON (PICKUP PHASE INTERLOCK)
    // # -------------------------------------------------------------
    if (btnGround) {
      btnGround.disabled = false;
      if (this.hasLoad) {
        btnGround.classList.remove('btn-slinger-ready', 'pulse-ready');
        btnGround.classList.add('btn-slinger-locked');
        if (hintGround) hintGround.textContent = 'Payload hooked! Slew to building apex at 24m to deliver';
        btnGround.innerHTML = isMagnet
          ? `<span>🧲 Magnet Energized (Clamped)</span>`
          : `<span>🔒 📞👷 Payload Hooked (Slew to Apex 24m)</span>`;
      } else if (this.currentLoadIndex >= CRANE_PHYSICS_CONFIG.LOADS.length) {
        btnGround.classList.remove('btn-slinger-ready', 'pulse-ready', 'btn-slinger-locked');
        if (hintGround) hintGround.textContent = 'All 3 Tenstar contracts delivered! Click to restart shift';
        btnGround.innerHTML = `<span>🏆 All 3 Loads Delivered (Shift Complete)</span>`;
      } else if (this.crewState === 'GROUND_RIGGING') {
        btnGround.classList.remove('btn-slinger-locked');
        btnGround.classList.add('btn-slinger-ready', 'pulse-ready');
        const progress = Math.min(100, Math.round((this.crewTimer / this.crewDuration) * 100));
        if (hintGround) hintGround.textContent = `Rigging in progress... ${progress}% (HOLD CONTROLS NEUTRAL)`;
        btnGround.innerHTML = `<span>⏳👷 Ground Slinger Attaching Slings (${progress}%)...</span>`;
      } else {
        const inPickup = this.isHookInPickupPosition();
        if (inPickup) {
          btnGround.classList.remove('btn-slinger-locked');
          btnGround.classList.add('btn-slinger-ready', 'pulse-ready');
          if (hintGround) hintGround.textContent = isMagnet
            ? '🟢 Clamping zone reached! Click to energize magnet'
            : '🟢 In pickup position! Click to call ground slinger';
          btnGround.innerHTML = `<span>🔓 IN POSITION — Click to Call Slinger!</span>`;

          // Edge Trigger: Spoken voice alert once when transitioning into position
          if (!this.wasInPickupPosition) {
            if (typeof window !== 'undefined' && window.CraneVoiceInstructor) {
              window.CraneVoiceInstructor.speak(
                "Hook is aligned over the ground payload. Keep controls neutral and click Call Ground Slinger to hook the load.",
                'pickup_ready',
                4
              );
            }
          }
        } else {
          btnGround.classList.remove('btn-slinger-ready', 'pulse-ready');
          btnGround.classList.add('btn-slinger-locked');
          const delta = this.getGroundSlingerDelta();
          btnGround.innerHTML = `<span>${delta.text}</span>`;
          if (hintGround) hintGround.textContent = delta.text;
        }
        this.wasInPickupPosition = inPickup;
      }
    }

    // # -------------------------------------------------------------
    // # ROOF SLINGER BUTTON (RELEASE PHASE INTERLOCK AT BUILDING APEX 24m)
    // # -------------------------------------------------------------
    if (btnRoof) {
      btnRoof.disabled = false;
      if (!this.hasLoad) {
        btnRoof.classList.remove('btn-slinger-ready', 'pulse-ready', 'btn-slinger-pop-green');
        btnRoof.classList.add('btn-slinger-locked');
        if (hintRoof) hintRoof.textContent = '🔒 Slinger Locked — Hook is empty, pickup ground payload first';
        btnRoof.innerHTML = isMagnet
          ? `<span>🔒 🧲 Magnet Idle (No Payload)</span>`
          : `<span>🔒 📞🏗️ Call Building Apex Slinger (No Payload)</span>`;
      } else if (this.crewState === 'ROOF_UNRIGGING') {
        btnRoof.classList.remove('btn-slinger-locked');
        btnRoof.classList.add('btn-slinger-ready', 'pulse-ready');
        const progress = Math.min(100, Math.round((this.crewTimer / this.crewDuration) * 100));
        if (hintRoof) hintRoof.textContent = `Unrigging in progress... ${progress}% (HOLD CONTROLS NEUTRAL)`;
        btnRoof.innerHTML = `<span>⏳🏗️ Apex Slinger Unhooking Slings (${progress}%)...</span>`;
      } else {
        const inDrop = this.isHookInDropPosition();

        if (inDrop) {
          btnRoof.classList.remove('btn-slinger-locked');
          btnRoof.classList.add('btn-slinger-ready', 'pulse-ready', 'btn-slinger-pop-green');
          if (hintRoof) hintRoof.textContent = isMagnet
            ? `🟢 ROOF SLINGER READY: Load is at Building Apex (24m)! Click to de-energize magnet`
            : `🟢 ROOF SLINGER READY: Load is at Building Apex (24m)! Click to release load`;
          btnRoof.innerHTML = `<span>🔓 IN POSITION — Click to Call Slinger!</span>`;

          // Edge Trigger: Spoken voice alert once when transitioning into position
          if (!this.wasInDropPosition) {
            if (typeof window !== 'undefined' && window.CraneVoiceInstructor) {
              window.CraneVoiceInstructor.speak(
                "Load is steady over the building apex. Click Call Building Apex Slinger to release the payload onto the roof.",
                'target_ready',
                4
              );
            }
          }
        } else {
          btnRoof.classList.remove('btn-slinger-ready', 'pulse-ready', 'btn-slinger-pop-green');
          btnRoof.classList.add('btn-slinger-locked');
          const delta = this.getApexSlingerDelta();
          btnRoof.innerHTML = `<span>${delta.text}</span>`;
          if (hintRoof) hintRoof.textContent = delta.text;
        }
        this.wasInDropPosition = inDrop;
      }
    }
  }

  // ========================================================================
  // # SECTION 3: SPLIT-SCREEN HTML5 CANVAS RENDERER (DAYLIGHT ABUJA SITE)
  // ========================================================================

  // # Function: Master Render Loop Partitioning Canvas (Full-Width Panoramic Site View)
  render() {
    if (!this.canvas || !this.ctx) return;
    const ctx = this.ctx;
    const w = this.canvas.width;
    const h = this.canvas.height;

    // # Safety Guard: Do not attempt to render into a collapsed or hidden canvas
    if (w < 100 || h < 100) return;

    // # Clear whole frame
    ctx.clearRect(0, 0, w, h);

    if (this.showRadarMap) {
      // # Optional Split View (Only if explicitly toggled on)
      const halfW = w / 2;

      // Render Left Half: Top-Down Site & Factory Yard Radar Map
      try {
        ctx.save();
        ctx.beginPath();
        ctx.rect(0, 0, halfW, h);
        ctx.clip();
        this.renderTopDownRadar(ctx, 0, 0, halfW, h);
        ctx.restore();
      } catch (e) {
        console.error('[CranePhysics] Radar render error:', e);
        ctx.restore();
      }

      // Render Right Half: Daylight Construction Site
      try {
        ctx.save();
        ctx.beginPath();
        ctx.rect(halfW, 0, halfW, h);
        ctx.clip();
        this.renderSideElevation(ctx, halfW, 0, halfW, h);
        ctx.restore();
      } catch (e) {
        console.error('[CranePhysics] Side elevation render error:', e);
        ctx.restore();
      }

      // Render Central Split-Screen Seam & Hazard Divider
      ctx.strokeStyle = '#f59e0b';
      ctx.lineWidth = 2;
      ctx.setLineDash([8, 6]);
      ctx.beginPath();
      ctx.moveTo(halfW, 0);
      ctx.lineTo(halfW, h);
      ctx.stroke();
      ctx.setLineDash([]); // Reset dash
    } else {
      // # FULL-WIDTH PANORAMIC DAYLIGHT CONSTRUCTION SITE & 3D TOWER CRANE
      // # Circular radar map hidden so the operator gets an expansive, ultra-wide view of the 6-story building, yard, truck, and tower crane
      try {
        this.renderSideElevation(ctx, 0, 0, w, h);
      } catch (e) {
        console.error('[CranePhysics] Panoramic site render error:', e);
      }
    }

    // # Render Floating Control Input Damping Oscilloscope (Bottom Deck)
    try {
      this.renderOscilloscope(ctx, 16, Math.max(10, h - 50), Math.max(50, w - 32), 40);
    } catch (e) {
      console.error('[CranePhysics] Oscilloscope render error:', e);
    }
  }

  // # Function: Render Left Half - Realistic Top-Down Site & Factory Yard Map (Worksite Terrain)
  renderTopDownRadar(ctx, x, y, width, height) {
    // # 1. Site Terrain Base (Industrial earth and concrete yard daylight gradient)
    const terrainGrad = ctx.createLinearGradient(x, y, x + width, y + height);
    terrainGrad.addColorStop(0.0, '#1e293b');
    terrainGrad.addColorStop(0.5, '#334155');
    terrainGrad.addColorStop(1.0, '#1e293b');
    ctx.fillStyle = terrainGrad;
    ctx.fillRect(x, y, width, height);

    // Terrain grid texture
    ctx.strokeStyle = 'rgba(51, 65, 85, 0.25)';
    ctx.lineWidth = 1;
    const gridStep = 24;
    for (let gx = x; gx < x + width; gx += gridStep) {
      ctx.beginPath();
      ctx.moveTo(gx, y);
      ctx.lineTo(gx, y + height);
      ctx.stroke();
    }
    for (let gy = y; gy < y + height; gy += gridStep) {
      ctx.beginPath();
      ctx.moveTo(x, gy);
      ctx.lineTo(x + width, gy);
      ctx.stroke();
    }

    // # 2. Radar Center Origin (Mast Location) & Dimensions
    const centerX = x + width / 2;
    const centerY = y + height / 2 - 16;
    const radarRadius = Math.max(20, Math.min(width / 2 - 36, height / 2 - 48));
    const maxRadiusM = CRANE_PHYSICS_CONFIG.JIB_LENGTH_MAX; // 50m
    const meterToPx = radarRadius / maxRadiusM;

    // # 3. Asphalt Factory Access Road
    ctx.save();
    ctx.beginPath();
    ctx.rect(x, y, width, height);
    ctx.clip();
    
    // Diagonal asphalt road running across yard
    ctx.fillStyle = '#0f172a';
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x, centerY + 80);
    ctx.lineTo(x + width, centerY - 60);
    ctx.lineTo(x + width, centerY - 20);
    ctx.lineTo(x, centerY + 120);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Road dashed yellow center line
    ctx.strokeStyle = '#f59e0b';
    ctx.lineWidth = 1.5;
    ctx.setLineDash([8, 8]);
    ctx.beginPath();
    ctx.moveTo(x, centerY + 100);
    ctx.lineTo(x + width, centerY - 40);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.restore();

    // # 4. Radar Outer Compass Ring & Distance Rings
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(centerX, centerY, Math.max(1, radarRadius), 0, Math.PI * 2);
    ctx.stroke();

    // Cardinal Compass Marks
    ctx.font = 'bold 9px monospace';
    ctx.fillStyle = '#94a3b8';
    ctx.textAlign = 'center';
    ctx.fillText('0° N', centerX, centerY - radarRadius - 6);
    ctx.fillText('180° S', centerX, centerY + radarRadius + 14);
    ctx.textAlign = 'left';
    ctx.fillText('90° E', centerX + radarRadius + 6, centerY + 3);
    ctx.textAlign = 'right';
    ctx.fillText('270° W', centerX - radarRadius - 6, centerY + 3);

    // Concentric Range Rings (10m, 20m, 30m, 40m, 50m)
    const ranges = [10, 20, 30, 40, 50];
    ctx.font = '9px monospace';
    ctx.fillStyle = '#64748b';
    ranges.forEach((r) => {
      const ringPx = Math.max(1, (r / maxRadiusM) * radarRadius);
      ctx.strokeStyle = r === 50 ? 'rgba(239, 68, 68, 0.45)' : 'rgba(71, 85, 105, 0.4)';
      ctx.lineWidth = r === 50 ? 1.5 : 1.0;
      ctx.beginPath();
      ctx.arc(centerX, centerY, ringPx, 0, Math.PI * 2);
      ctx.stroke();
      ctx.fillText(`${r}m`, centerX + 4, centerY - ringPx + 11);
    });

    // Crosshairs
    ctx.strokeStyle = 'rgba(71, 85, 105, 0.35)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(centerX - radarRadius, centerY);
    ctx.lineTo(centerX + radarRadius, centerY);
    ctx.moveTo(centerX, centerY - radarRadius);
    ctx.lineTo(centerX, centerY + radarRadius);
    ctx.stroke();

    // # 5. Red Hatched Pedestrian Exclusion Zone (Prohibited Area)
    CRANE_PHYSICS_CONFIG.EXCLUSION_ZONES.forEach(zone => {
      const startRad = ((zone.startAngleDeg - 90) * Math.PI) / 180.0;
      const endRad = ((zone.endAngleDeg - 90) * Math.PI) / 180.0;
      const minRPx = zone.minRadiusM * meterToPx;
      const maxRPx = zone.maxRadiusM * meterToPx;

      ctx.save();
      ctx.beginPath();
      ctx.arc(centerX, centerY, maxRPx, startRad, endRad);
      ctx.arc(centerX, centerY, minRPx, endRad, startRad, true);
      ctx.closePath();
      ctx.fillStyle = 'rgba(239, 68, 68, 0.18)';
      ctx.fill();
      ctx.strokeStyle = '#ef4444';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // Danger label
      const midAngleRad = ((zone.startAngleDeg + zone.endAngleDeg) / 2 - 90) * (Math.PI / 180.0);
      const midRPx = (minRPx + maxRPx) / 2;
      ctx.fillStyle = '#fca5a5';
      ctx.font = 'bold 8px system-ui';
      ctx.textAlign = 'center';
      ctx.fillText(zone.label, centerX + midRPx * Math.cos(midAngleRad), centerY + midRPx * Math.sin(midAngleRad));
      ctx.restore();
    });

    // # 6. Fenced Material Laydown Pickup Bay (R = 16m, θ = 45°)
    const pbAngleRad = ((45.0 - 90) * Math.PI) / 180.0;
    const pbDistPx = 16.0 * meterToPx;
    const pbX = centerX + pbDistPx * Math.cos(pbAngleRad);
    const pbY = centerY + pbDistPx * Math.sin(pbAngleRad);
    const pbSizePx = Math.max(16, 4.0 * meterToPx);

    // Concrete pad & green security fence
    ctx.save();
    ctx.fillStyle = 'rgba(30, 41, 59, 0.85)';
    ctx.fillRect(pbX - pbSizePx, pbY - pbSizePx, pbSizePx * 2, pbSizePx * 2);
    ctx.strokeStyle = this.isHookInPickupBay() ? '#10b981' : '#059669';
    ctx.lineWidth = 2;
    ctx.strokeRect(pbX - pbSizePx, pbY - pbSizePx, pbSizePx * 2, pbSizePx * 2);

    // Green chain-link corner posts
    ctx.fillStyle = '#10b981';
    [[-pbSizePx, -pbSizePx], [pbSizePx, -pbSizePx], [pbSizePx, pbSizePx], [-pbSizePx, pbSizePx]].forEach(([ox, oy]) => {
      ctx.fillRect(pbX + ox - 2, pbY + oy - 2, 4, 4);
    });

    // Staging timber dunnage
    ctx.fillStyle = '#78350f';
    ctx.fillRect(pbX - 10, pbY - 4, 20, 8);

    // Pickup Zone Label
    ctx.fillStyle = '#10b981';
    ctx.font = 'bold 8px system-ui';
    ctx.textAlign = 'center';
    ctx.fillText('GROUND PICKUP BAY (0m)', pbX, pbY - pbSizePx - 4);

    const currentLoad = CRANE_PHYSICS_CONFIG.LOADS[this.currentLoadIndex];
    if (!this.hasLoad && currentLoad) {
      ctx.fillStyle = currentLoad.color;
      ctx.fillRect(pbX - 7, pbY - 3, 14, 6);
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1;
      ctx.strokeRect(pbX - 7, pbY - 3, 14, 6);
      ctx.fillStyle = '#f8fafc';
      ctx.font = 'bold 7px monospace';
      ctx.fillText(`${currentLoad.name} (${currentLoad.massTonnes}t)`, pbX, pbY + pbSizePx + 11);
    }
    ctx.restore();

    // # 7. 6-Story Building Roof Blueprint (R = 28m-34m, θ = 135°)
    const bldgAngleRad = ((135.0 - 90) * Math.PI) / 180.0;
    const bldgDistPx = 30.0 * meterToPx;
    const bldgX = centerX + bldgDistPx * Math.cos(bldgAngleRad);
    const bldgY = centerY + bldgDistPx * Math.sin(bldgAngleRad);
    const bldgWPx = Math.max(28, 8.0 * meterToPx);
    const bldgHPx = Math.max(22, 6.0 * meterToPx);

    // Blueprint background
    ctx.save();
    ctx.fillStyle = 'rgba(30, 58, 138, 0.4)';
    ctx.fillRect(bldgX - bldgWPx / 2, bldgY - bldgHPx / 2, bldgWPx, bldgHPx);
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(bldgX - bldgWPx / 2, bldgY - bldgHPx / 2, bldgWPx, bldgHPx);

    // Structural columns on blueprint
    ctx.fillStyle = '#60a5fa';
    [
      [-bldgWPx / 2 + 3, -bldgHPx / 2 + 3],
      [bldgWPx / 2 - 3, -bldgHPx / 2 + 3],
      [bldgWPx / 2 - 3, bldgHPx / 2 - 3],
      [-bldgWPx / 2 + 3, bldgHPx / 2 - 3]
    ].forEach(([cx, cy]) => {
      ctx.fillRect(bldgX + cx - 2, bldgY + cy - 2, 4, 4);
    });

    // Target Landing Marker on Blueprint
    const isTargetReady = this.isOnTarget;
    ctx.fillStyle = isTargetReady ? 'rgba(16, 185, 129, 0.5)' : 'rgba(245, 158, 11, 0.3)';
    ctx.strokeStyle = isTargetReady ? '#10b981' : '#f59e0b';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(bldgX, bldgY, 20, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    const targetFloorName = currentLoad ? currentLoad.target.floor : 'Building Apex Roof Deck (24m)';
    ctx.fillStyle = isTargetReady ? '#10b981' : '#38bdf8';
    ctx.font = 'bold 8px system-ui';
    ctx.textAlign = 'center';
    ctx.fillText(`BUILDING APEX ROOF DECK (24m)`, bldgX, bldgY - bldgHPx / 2 - 4);
    ctx.restore();

    // Delivered Loads markers on Building
    this.deliveredLoads.forEach(deliv => {
      const dAngle = ((deliv.target.angleDeg - 90) * Math.PI) / 180.0;
      const dDist = deliv.target.radiusM * meterToPx;
      const dx = centerX + dDist * Math.cos(dAngle);
      const dy = centerY + dDist * Math.sin(dAngle);
      ctx.fillStyle = '#06b6d4';
      ctx.fillRect(dx - 4, dy - 4, 8, 8);
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1;
      ctx.strokeRect(dx - 4, dy - 4, 8, 8);
    });

    // # 8. Crane Mast, Counter-Jib & Working Jib Boom
    const slewAngleRad = ((this.slewAngleDeg - 90) * Math.PI) / 180.0;
    const boomLengthPx = radarRadius;
    const boomEndX = centerX + boomLengthPx * Math.cos(slewAngleRad);
    const boomEndY = centerY + boomLengthPx * Math.sin(slewAngleRad);

    // Counter-Jib (Opposite direction, 16m)
    const counterJibPx = 16.0 * meterToPx;
    const counterEndX = centerX - counterJibPx * Math.cos(slewAngleRad);
    const counterEndY = centerY - counterJibPx * Math.sin(slewAngleRad);

    ctx.strokeStyle = '#64748b';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(centerX, centerY);
    ctx.lineTo(counterEndX, counterEndY);
    ctx.stroke();

    // Concrete counterweights on counter-jib
    ctx.fillStyle = '#475569';
    ctx.fillRect(counterEndX - 4, counterEndY - 4, 8, 8);

    // Tower Crane Center Mast Foundation
    ctx.fillStyle = '#f59e0b';
    ctx.strokeStyle = '#d97706';
    ctx.lineWidth = 2;
    ctx.fillRect(centerX - 5, centerY - 5, 10, 10);
    ctx.strokeRect(centerX - 5, centerY - 5, 10, 10);

    // Working Jib Boom Line (Safety Yellow)
    ctx.strokeStyle = '#f59e0b';
    ctx.lineWidth = 3.5;
    ctx.beginPath();
    ctx.moveTo(centerX, centerY);
    ctx.lineTo(boomEndX, boomEndY);
    ctx.stroke();

    // Trolley Carriage
    const trolleyDistPx = Math.min(radarRadius, (this.trolleyRadiusM / maxRadiusM) * radarRadius);
    const trolleyX = centerX + trolleyDistPx * Math.cos(slewAngleRad);
    const trolleyY = centerY + trolleyDistPx * Math.sin(slewAngleRad);

    ctx.fillStyle = '#0284c7';
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 1.5;
    ctx.fillRect(trolleyX - 4, trolleyY - 4, 8, 8);
    ctx.strokeRect(trolleyX - 4, trolleyY - 4, 8, 8);

    // # 9. Dynamic Hook Position with Pendulum Sway Vector
    const radSwayRad = (this.pendulumRadialDeg * Math.PI) / 180.0;
    const tanSwayRad = (this.pendulumTangentialDeg * Math.PI) / 180.0;
    const radialOffsetPx = this.cableLengthM * Math.sin(radSwayRad) * meterToPx;
    const tanOffsetPx = this.cableLengthM * Math.sin(tanSwayRad) * meterToPx;

    const hookX = trolleyX + radialOffsetPx * Math.cos(slewAngleRad) - tanOffsetPx * Math.sin(slewAngleRad);
    const hookY = trolleyY + radialOffsetPx * Math.sin(slewAngleRad) + tanOffsetPx * Math.cos(slewAngleRad);

    // Sway Vector Line
    ctx.strokeStyle = 'rgba(239, 68, 68, 0.7)';
    ctx.lineWidth = 1.5;
    ctx.setLineDash([3, 3]);
    ctx.beginPath();
    ctx.moveTo(trolleyX, trolleyY);
    ctx.lineTo(hookX, hookY);
    ctx.stroke();
    ctx.setLineDash([]);

    // Hook / Magnet Head
    if (this.riggingMode === 'MAGNET') {
      ctx.fillStyle = this.hasLoad ? '#06b6d4' : '#f59e0b';
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1.5;
      ctx.fillRect(hookX - 5, hookY - 5, 10, 10);
      ctx.strokeRect(hookX - 5, hookY - 5, 10, 10);
    } else {
      ctx.fillStyle = this.hasLoad ? '#ef4444' : '#10b981';
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(hookX, hookY, this.hasLoad ? 6 : 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    }

    // Animated Ground Rigger on Radar during Hooking
    if (this.crewState === 'GROUND_RIGGING') {
      const walkT = this.crewTimer / this.crewDuration;
      const rigX = pbX + (hookX - pbX) * Math.min(1.0, walkT * 1.5);
      const rigY = pbY + (hookY - pbY) * Math.min(1.0, walkT * 1.5);

      ctx.fillStyle = '#f59e0b';
      ctx.beginPath();
      ctx.arc(rigX, rigY, 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 7px system-ui';
      ctx.fillText('RIGGER', rigX, rigY - 6);
    }

    // Top-Down Dynamic Alignment Guide Vector to Active Target (Rule 4)
    const isPickupPhase = !this.hasLoad;
    let targetRadarX, targetRadarY, inRadarPos;
    if (isPickupPhase) {
      targetRadarX = pbX;
      targetRadarY = pbY;
      inRadarPos = this.isHookInPickupPosition();
    } else if (currentLoad) {
      const tzAngleRad = ((currentLoad.target.angleDeg - 90) * Math.PI) / 180.0;
      const tzDistPx = (currentLoad.target.radiusM / maxRadiusM) * radarRadius;
      targetRadarX = centerX + tzDistPx * Math.cos(tzAngleRad);
      targetRadarY = centerY + tzDistPx * Math.sin(tzAngleRad);
      inRadarPos = this.isHookInDropPosition();
    }

    if (targetRadarX !== undefined) {
      ctx.save();
      if (inRadarPos) {
        ctx.strokeStyle = '#10b981';
        ctx.lineWidth = 2.0;
        ctx.setLineDash([]);
        ctx.beginPath();
        ctx.moveTo(hookX, hookY);
        ctx.lineTo(targetRadarX, targetRadarY);
        ctx.stroke();

        ctx.strokeStyle = '#10b981';
        ctx.lineWidth = 2.0;
        ctx.beginPath();
        ctx.arc(targetRadarX, targetRadarY, 14, 0, Math.PI * 2);
        ctx.stroke();

        ctx.fillStyle = '#10b981';
        ctx.font = 'bold 7px system-ui';
        ctx.textAlign = 'center';
        ctx.fillText('LOCKED ✓', targetRadarX, targetRadarY - 16);
      } else {
        ctx.strokeStyle = 'rgba(245, 158, 11, 0.6)';
        ctx.lineWidth = 1.2;
        ctx.setLineDash([3, 3]);
        ctx.beginPath();
        ctx.moveTo(hookX, hookY);
        ctx.lineTo(targetRadarX, targetRadarY);
        ctx.stroke();
        ctx.setLineDash([]);
      }

      // # Matching Top-Down Payload Footprint on Rooftop Target Safe Zone (Drawn With Lines)
      // # User Directive: "AND ALSO A SHAPE SIMILAR IN SIZE AS THE LOAD SHOULD BE DRAWN WITH LINES ON THE TOP OF THE BUILDING SIGNIFYING THE SAFE ZONE TO PLACE THE LOAD"
      if (!isPickupPhase && currentLoad) {
        const isAtFloor = this.isHookWithinTargetFloor();
        ctx.save();
        ctx.translate(targetRadarX, targetRadarY);
        const bldgRot = ((currentLoad.target.angleDeg - 90) * Math.PI) / 180.0;
        ctx.rotate(bldgRot);

        ctx.fillStyle = isAtFloor ? 'rgba(0, 255, 136, 0.45)' : 'rgba(16, 185, 129, 0.22)';
        ctx.strokeStyle = isAtFloor ? '#00ff88' : '#10b981';
        ctx.lineWidth = isAtFloor ? 2.2 : 1.4;

        if (currentLoad.id === 'LOAD_1_REBAR') {
          // Rebar bundle footprint drawn with lines
          ctx.fillRect(-12, -5, 24, 10);
          ctx.strokeRect(-12, -5, 24, 10);
          ctx.beginPath();
          ctx.moveTo(-11, -2); ctx.lineTo(11, -2);
          ctx.moveTo(-11, 2); ctx.lineTo(11, 2);
          ctx.stroke();
        } else if (currentLoad.id === 'LOAD_2_PRECAST_BEAM') {
          // Precast beam footprint drawn with lines
          ctx.fillRect(-14, -4, 28, 8);
          ctx.strokeRect(-14, -4, 28, 8);
          ctx.beginPath();
          ctx.moveTo(-14, 0); ctx.lineTo(14, 0);
          ctx.stroke();
        } else {
          // Chiller unit footprint drawn with lines
          ctx.fillRect(-10, -7, 20, 14);
          ctx.strokeRect(-10, -7, 20, 14);
          ctx.beginPath();
          ctx.arc(3, 0, 3.5, 0, Math.PI * 2);
          ctx.moveTo(-8, -3); ctx.lineTo(-2, -3);
          ctx.moveTo(-8, 0); ctx.lineTo(-2, 0);
          ctx.moveTo(-8, 3); ctx.lineTo(-2, 3);
          ctx.stroke();
        }

        // Corner L-Bracket Boundary Lines
        ctx.lineWidth = 1.8;
        ctx.strokeRect(-15, -8, 30, 16);

        if (isAtFloor) {
          ctx.fillStyle = '#00ff88';
          ctx.font = 'bold 7px system-ui';
          ctx.textAlign = 'center';
          ctx.fillText('🟢 ROOF SAFE ZONE READY', 0, 16);
        }
        ctx.restore();
      }

      ctx.restore();
    }

    // Header Badge
    ctx.textAlign = 'left';
    ctx.fillStyle = '#f8fafc';
    ctx.font = 'bold 11px system-ui';
    ctx.fillText('TOP-DOWN SITE & FACTORY YARD MAP (360°)', x + 16, y + 22);
    ctx.fillStyle = '#94a3b8';
    ctx.font = '10px monospace';
    const loadDesc = this.hasLoad && currentLoad ? `${currentLoad.name} (${currentLoad.massTonnes}t)` : 'EMPTY HOOK';
    ctx.fillText(`BEARING: ${this.slewAngleDeg.toFixed(1)}° | RADIUS: ${this.trolleyRadiusM.toFixed(1)}m | ${loadDesc}`, x + 16, y + 36);
  }

  // # Function: Render Panoramic Daylight Construction Site & 6-Story High-Rise Digital Twin
  renderSideElevation(ctx, x, y, width, height) {
    // # Elevation Scaling & Floor Datum Coordinates
    const marginL = 50;
    const marginB = 75;
    const groundY = y + height - marginB;
    const maxPlotHeight = height - marginB - 55;
    const apexHeightM = 40.0; // Scale top height up to 40m for 36m mast + cathead apex

    // # Function: Convert elevation in meters to Canvas Y Coordinate
    // # Equation: py = groundY - (meters / apexHeightM) * maxPlotHeight
    const meterToY = (meters) => groundY - (meters / apexHeightM) * maxPlotHeight;

    // # Horizontal Yard & Jib Placement across wide canvas
    const shedX = x + 16;
    const shedW = Math.min(85, Math.max(60, width * 0.08));
    const shedH = 48;
    const shedY = groundY - shedH;

    const truckX = shedX + shedW + 12;
    const truckW = Math.min(80, Math.max(55, width * 0.075));

    // Crane Mast Center & Position
    const mastX = Math.max(x + 160, truckX + truckW + 18);
    const mastW = 30;
    const mastDepth = 8;
    const mastTopY = meterToY(CRANE_PHYSICS_CONFIG.CAB_MAST_HEIGHT); // 36m height
    const mastCenterX = mastX + mastW / 2;

    // Working Jib Extends Rightwards across the construction site
    const jibStartX = mastX + mastW;
    const jibEndX = x + width - 24;
    const jibAvailableWidth = Math.max(150, jibEndX - jibStartX - 24);

    // # Coordinate Scale for Radius X:
    // Physical minimum trolley limit stop: r = 4.0m (just outside the cab)
    // Physical maximum working jib reach: r = 48.0m (near the outer jib tip)
    const scaleX = (r) => (jibStartX + 8) + ((r - 4.0) / 44.0) * jibAvailableWidth;

    // # 1. Realistic Daylight Sky & Golden-Hour Abuja Site Atmosphere
    const skyGrad = ctx.createLinearGradient(x, y, x, groundY);
    skyGrad.addColorStop(0.0, '#1e3a8a'); // Deep sky blue
    skyGrad.addColorStop(0.35, '#0284c7'); // Bright tropical azure
    skyGrad.addColorStop(0.70, '#38bdf8'); // Daylight horizon azure
    skyGrad.addColorStop(0.92, '#bae6fd'); // Atmospheric haze
    skyGrad.addColorStop(1.0, '#fef08a'); // Warm golden-hour horizon glow
    ctx.fillStyle = skyGrad;
    ctx.fillRect(x, y, width, height);

    // # Golden Sun with warm radial glow and subtle sun rays
    const sunX = x + width * 0.22;
    const sunY = y + 70;
    const sunGlow = ctx.createRadialGradient(sunX, sunY, 5, sunX, sunY, 65);
    sunGlow.addColorStop(0.0, 'rgba(254, 240, 138, 0.95)');
    sunGlow.addColorStop(0.35, 'rgba(253, 224, 71, 0.45)');
    sunGlow.addColorStop(1.0, 'rgba(253, 224, 71, 0.0)');
    ctx.fillStyle = sunGlow;
    ctx.beginPath();
    ctx.arc(sunX, sunY, 65, 0, Math.PI * 2);
    ctx.fill();

    // Sun Core Disc
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(sunX, sunY, 14, 0, Math.PI * 2);
    ctx.fill();

    // # Distant Fluffy Daylight Clouds
    ctx.fillStyle = 'rgba(255, 255, 255, 0.70)';
    const drawCloud = (cx, cy, scale) => {
      ctx.beginPath();
      ctx.arc(cx, cy, 14 * scale, 0, Math.PI * 2);
      ctx.arc(cx + 14 * scale, cy - 6 * scale, 18 * scale, 0, Math.PI * 2);
      ctx.arc(cx + 32 * scale, cy - 4 * scale, 16 * scale, 0, Math.PI * 2);
      ctx.arc(cx + 46 * scale, cy + 2 * scale, 12 * scale, 0, Math.PI * 2);
      ctx.arc(cx + 24 * scale, cy + 6 * scale, 14 * scale, 0, Math.PI * 2);
      ctx.fill();
    };
    drawCloud(x + width * 0.45, y + 42, 0.9);
    drawCloud(x + width * 0.78, y + 68, 0.75);
    drawCloud(x + width * 0.12, y + 85, 0.65);

    // # Distant Abuja Zuma Rock / Monolith Mountain Profile in Atmospheric Haze
    ctx.fillStyle = 'rgba(100, 116, 139, 0.35)';
    ctx.beginPath();
    ctx.moveTo(x, groundY);
    ctx.lineTo(x, groundY - 35);
    ctx.quadraticCurveTo(x + width * 0.15, groundY - 95, x + width * 0.32, groundY - 30);
    ctx.quadraticCurveTo(x + width * 0.48, groundY - 60, x + width * 0.65, groundY - 25);
    ctx.lineTo(x + width, groundY - 20);
    ctx.lineTo(x + width, groundY);
    ctx.closePath();
    ctx.fill();

    // Distant Abuja Skyline Silhouette (Industrial plants, telecommunications mast)
    ctx.fillStyle = 'rgba(71, 85, 105, 0.28)';
    for (let b = 0; b < 10; b++) {
      const bx = x + width * 0.28 + b * 26;
      const bh = 15 + ((b * 37) % 35);
      ctx.fillRect(bx, groundY - bh, 18, bh);
    }

    // # 2. Ground Sub-Base (African Laterite Earth & Concrete Yard Slab)
    const earthGrad = ctx.createLinearGradient(x, groundY, x, y + height);
    earthGrad.addColorStop(0.0, '#78350f'); // Warm African laterite brown
    earthGrad.addColorStop(0.35, '#451a03'); // Dark compact subsoil
    earthGrad.addColorStop(1.0, '#1c1917');
    ctx.fillStyle = earthGrad;
    ctx.fillRect(x, groundY, width, height - (groundY - y));

    // Reinforced Foundation Concrete Slab (0m Datum)
    ctx.fillStyle = '#64748b';
    ctx.fillRect(x + marginL, groundY - 6, width - marginL - 16, 8);
    ctx.strokeStyle = '#94a3b8';
    ctx.lineWidth = 1;
    ctx.strokeRect(x + marginL, groundY - 6, width - marginL - 16, 8);

    // Yellow/Black Hazard Striping along yard edge
    const stripeCount = Math.floor((width - marginL - 20) / 14);
    for (let s = 0; s < stripeCount; s++) {
      ctx.fillStyle = (s % 2 === 0) ? '#eab308' : '#0f172a';
      ctx.fillRect(x + marginL + s * 14, groundY - 8, 14, 3);
    }

    // # 3. Precast Warehouse Shed & Parked Flatbed Delivery Truck (Left Flank)
    // Warehouse Corrugated Metal Shed Profile
    ctx.fillStyle = '#334155';
    ctx.fillRect(shedX, shedY, shedW, shedH);
    ctx.strokeStyle = '#475569';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(shedX, shedY, shedW, shedH);

    // Pitched Roof
    ctx.fillStyle = '#1e293b';
    ctx.beginPath();
    ctx.moveTo(shedX - 4, shedY);
    ctx.lineTo(shedX + shedW / 2, shedY - 12);
    ctx.lineTo(shedX + shedW + 4, shedY);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Warehouse Bay Door & CRANELAB Yard Sign
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(shedX + 8, groundY - 32, 28, 32);
    ctx.strokeStyle = '#eab308';
    ctx.strokeRect(shedX + 8, groundY - 32, 28, 32);

    ctx.fillStyle = '#f8fafc';
    ctx.font = 'bold 7px system-ui';
    ctx.textAlign = 'center';
    ctx.fillText('CRANELAB PRECAST YARD', shedX + shedW / 2, shedY + 10);

    // Parked Heavy Flatbed Delivery Truck (Between shed and crane mast)
    const truckY = groundY;
    // Truck Cab
    ctx.fillStyle = '#dc2626'; // High-vis red tractor unit
    ctx.fillRect(truckX, truckY - 24, 22, 20);
    ctx.fillStyle = '#38bdf8'; // Cab windshield
    ctx.fillRect(truckX + 11, truckY - 22, 9, 9);
    ctx.fillStyle = '#1e293b'; // Grille
    ctx.fillRect(truckX + 18, truckY - 11, 4, 7);
    // Truck Flatbed Trailer
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(truckX + 24, truckY - 12, truckW - 24, 8);
    // Wheels
    ctx.fillStyle = '#09090b';
    [truckX + 6, truckX + 16, truckX + truckW - 22, truckX + truckW - 8].forEach(wx => {
      ctx.beginPath();
      ctx.arc(wx, truckY - 4, 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#94a3b8';
      ctx.beginPath();
      ctx.arc(wx, truckY - 4, 1.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#09090b';
    });

    // # 4. Material Laydown Pickup Bay at 0m (R = 16m)
    const pickupBayX = scaleX(16.0);
    ctx.fillStyle = 'rgba(16, 185, 129, 0.25)';
    ctx.strokeStyle = '#10b981';
    ctx.lineWidth = 2;
    ctx.fillRect(pickupBayX - 26, groundY - 8, 52, 8);
    ctx.strokeRect(pickupBayX - 26, groundY - 8, 52, 8);

    // Heavy Timber Dunnage Supports (Brown Oak Sleepers)
    ctx.fillStyle = '#92400e';
    ctx.fillRect(pickupBayX - 20, groundY - 11, 10, 3);
    ctx.fillRect(pickupBayX + 10, groundY - 11, 10, 3);

    ctx.fillStyle = '#10b981';
    ctx.font = 'bold 8px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('0m PICKUP BAY (R:16m)', pickupBayX, groundY + 16);

    // If hook is empty and load is awaiting pickup, draw waiting payload on ground dunnage
    const currentLoad = CRANE_PHYSICS_CONFIG.LOADS[this.currentLoadIndex];
    if (!this.hasLoad && currentLoad) {
      this.renderPayloadModel(ctx, pickupBayX, groundY - 11, currentLoad, false);
    }

    // # -------------------------------------------------------------
    // # Draw High-Rise Building Architecture (Building Apex 24.0m)
    // # -------------------------------------------------------------
    const bldgMinX = scaleX(25.0);
    const bldgMaxX = scaleX(37.0);
    const bldgWidth = bldgMaxX - bldgMinX;
    const roofY = meterToY(24.0); // # Top of Building Apex Deck (24.0m)
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

    // Draw Floor Slabs (GF 0m, 1F 4m, 2F 8m, 3F 12m, 4F 16m, 5F 20m, Apex Roof 24m)
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
      if (floor.heightM > 0 && floor.heightM <= 20.0) {
        const prevSlabY = meterToY(floor.heightM - 4.0);
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

    // Construction Scaffolding on Right Exterior Flank with Orange Safety Netting
    const scafX = bldgMaxX + 2;
    const scafW = 16;
    ctx.fillStyle = 'rgba(249, 115, 22, 0.35)'; // High-vis orange safety netting
    ctx.fillRect(scafX, roofY, scafW, bldgHeight);
    ctx.strokeStyle = '#ca8a04';
    ctx.lineWidth = 1;
    for (let sy = roofY; sy < groundY; sy += 14) {
      ctx.strokeRect(scafX, sy, scafW, 14);
      ctx.beginPath();
      ctx.moveTo(scafX, sy);
      ctx.lineTo(scafX + scafW, sy + 14);
      ctx.stroke();
    }

    // Roof Parapet / Safety Handrails (Building Apex Roof 24m)
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

    // # -------------------------------------------------------------
    // # VISIBLE 3D TARGET LANDING ZONE BEACON, LASER & GUIDANCE SIGNS
    // # -------------------------------------------------------------
    if (currentLoad) {
      const targetY = meterToY(currentLoad.target.heightM);
      const isHookAtDrop = this.isHookAtDropCoordinates();
      const now = performance.now();

      // # -------------------------------------------------------------
      // # ROOFTOP SAFE LANDING ZONE (TOP OF BUILDING) (Rule 10)
      // # User Directive: "THE LOAD SHOULD BE PLACED ON THE BUILDING ITSELF NOT THE FIFTH FLOOR ANYMORE"
      // # -------------------------------------------------------------
      const deckLeft = bldgMinX;
      const deckRight = bldgMaxX;
      const deckW = bldgMaxX - bldgMinX;
      const deckH = 14;
      const deckTop = targetY - deckH;
      const laserTopY = mastTopY;
      const laserH = targetY - laserTopY;

      // Current hook horizontal position projected onto the rooftop slab
      const hookProjX = Math.max(deckLeft + 8, Math.min(deckRight - 8, scaleX(this.trolleyRadiusM)));
      const isHookOverFloor = (this.trolleyRadiusM >= 20.0 && this.trolleyRadiusM <= 42.0);

      // # 1. ROOFTOP SLAB ILLUMINATION & HAZARD STRIPING (TOP OF BUILDING)
      ctx.fillStyle = isHookAtDrop ? 'rgba(6, 95, 70, 0.85)' : 'rgba(16, 185, 129, 0.18)';
      ctx.fillRect(deckLeft, deckTop, deckW, deckH);

      // Continuous Hazard Chevrons across the rooftop slab edge
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(deckLeft, targetY - 4, deckW, 4);
      ctx.fillStyle = '#eab308';
      for (let chx = deckLeft; chx < deckRight - 4; chx += 8) {
        ctx.beginPath();
        ctx.moveTo(chx, targetY);
        ctx.lineTo(chx + 4, targetY);
        ctx.lineTo(chx + 8, targetY - 4);
        ctx.lineTo(chx + 4, targetY - 4);
        ctx.closePath();
        ctx.fill();
      }

      // Deck Luminous Border
      ctx.strokeStyle = isHookAtDrop ? '#00ff88' : '#10b981';
      ctx.lineWidth = isHookAtDrop ? 3.0 : 2.0;
      ctx.strokeRect(deckLeft, deckTop, deckW, deckH);

      // Grid deck floor markers every 16px across the entire roof
      ctx.strokeStyle = isHookAtDrop ? 'rgba(0, 255, 136, 0.4)' : 'rgba(16, 185, 129, 0.22)';
      ctx.lineWidth = 1;
      for (let gx = deckLeft + 16; gx < deckRight - 6; gx += 16) {
        ctx.beginPath();
        ctx.moveTo(gx, deckTop);
        ctx.lineTo(gx, targetY - 4);
        ctx.stroke();
      }

      // # 2. DUAL PERIMETER BOUNDARY LASER CURTAINS (Left & Right Building Columns)
      ctx.strokeStyle = isHookAtDrop ? 'rgba(0, 255, 136, 0.85)' : 'rgba(52, 211, 153, 0.45)';
      ctx.lineWidth = 1.6;
      ctx.setLineDash([6, 6]);
      ctx.lineDashOffset = -(now * 0.03) % 12;
      ctx.beginPath();
      // Left boundary laser at 25m
      ctx.moveTo(deckLeft, laserTopY);
      ctx.lineTo(deckLeft, targetY);
      // Right boundary laser at 37m
      ctx.moveTo(deckRight, laserTopY);
      ctx.lineTo(deckRight, targetY);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.lineDashOffset = 0;

      // # 3. DYNAMIC HOOK DROP POINT GUIDE LASER & SONAR RINGS
      // Follows wherever the hook is positioned over the rooftop safe zone
      if (isHookOverFloor) {
        // Laser column directly under current hook position
        const laserGlow = ctx.createLinearGradient(hookProjX - 22, 0, hookProjX + 22, 0);
        laserGlow.addColorStop(0, 'rgba(16, 185, 129, 0)');
        laserGlow.addColorStop(0.5, isHookAtDrop ? 'rgba(52, 211, 153, 0.55)' : 'rgba(16, 185, 129, 0.22)');
        laserGlow.addColorStop(1, 'rgba(16, 185, 129, 0)');
        ctx.fillStyle = laserGlow;
        ctx.fillRect(hookProjX - 22, laserTopY, 44, laserH);

        ctx.strokeStyle = isHookAtDrop ? '#00ff88' : '#34d399';
        ctx.lineWidth = isHookAtDrop ? 3.0 : 1.8;
        ctx.setLineDash([8, 6]);
        ctx.lineDashOffset = -(now * 0.04) % 14;
        ctx.beginPath();
        ctx.moveTo(hookProjX, laserTopY);
        ctx.lineTo(hookProjX, targetY);
        ctx.stroke();
        ctx.setLineDash([]);

        // Trolley alignment arrow on working jib
        ctx.fillStyle = isHookAtDrop ? '#00ff88' : '#f59e0b';
        ctx.beginPath();
        ctx.moveTo(hookProjX - 8, mastTopY - 2);
        ctx.lineTo(hookProjX + 8, mastTopY - 2);
        ctx.lineTo(hookProjX, mastTopY + 8);
        ctx.closePath();
        ctx.fill();

        // Bullseye under hook position on slab
        ctx.fillStyle = isHookAtDrop ? '#00ff88' : '#34d399';
        ctx.beginPath();
        ctx.arc(hookProjX, targetY - deckH / 2, 5, 0, Math.PI * 2);
        ctx.fill();

        // Pulsing Sonar Landing Rings under Hook Position
        const pulsePhase = (now % 1600) / 1600;
        const pulseR = 8 + pulsePhase * 36;
        const pulseAlpha = Math.max(0, 1 - pulsePhase);
        ctx.strokeStyle = isHookAtDrop
          ? `rgba(0, 255, 136, ${pulseAlpha.toFixed(2)})`
          : `rgba(16, 185, 129, ${pulseAlpha.toFixed(2)})`;
        ctx.lineWidth = 2.0;
        ctx.beginPath();
        ctx.arc(hookProjX, targetY - deckH / 2, pulseR, 0, Math.PI * 2);
        ctx.stroke();
      }

      // # 3b. TARGET LANDING ZONE CRADLE MATCHING EXACT PAYLOAD GEOMETRY (Rule 10)
      // User Directive: "AND ALSO A SHAPE SIMILAR IN SIZE AS THE LOAD SHOULD BE DRAWN WITH LINES ON THE TOP OF THE BUILDING SIGNIFYING THE SAFE ZONE TO PLACE THE LOAD"
      const designatedTargetX = scaleX(currentLoad.target.radiusM);
      this.renderPayloadLandingCradle(ctx, designatedTargetX, targetY, currentLoad, isHookAtDrop);

      // If hook is positioned over rooftop slab and away from designated target, also render matching touchdown cradle under the hook!
      if (isHookOverFloor && Math.abs(hookProjX - designatedTargetX) > 22) {
        this.renderPayloadLandingCradle(ctx, hookProjX, targetY, currentLoad, isHookAtDrop);
      }

      // # 4. LEFT & RIGHT STANCHION WARNING LIGHTS
      const strobeActive = Math.sin(now * 0.008) > 0;
      const strobeColor = isHookAtDrop ? '#00ff88' : (strobeActive ? '#f59e0b' : '#78350f');

      // Left Stanchion
      ctx.fillStyle = '#64748b';
      ctx.fillRect(deckLeft - 3, targetY - 22, 3, 22);
      ctx.fillStyle = strobeColor;
      ctx.beginPath();
      ctx.arc(deckLeft - 1.5, targetY - 23, 4.0, 0, Math.PI * 2);
      ctx.fill();

      // Right Stanchion
      ctx.fillStyle = '#64748b';
      ctx.fillRect(deckRight, targetY - 22, 3, 22);
      ctx.fillStyle = strobeColor;
      ctx.beginPath();
      ctx.arc(deckRight + 1.5, targetY - 23, 4.0, 0, Math.PI * 2);
      ctx.fill();

      // # 5. EXPANDED SIGNBOARD (DROP IN ROOFTOP SAFE ZONE ON TOP OF BUILDING)
      const signW = Math.min(280, deckW + 30);
      const signH = 28;
      const signX = (deckLeft + deckRight) / 2 - signW / 2;
      const signY = targetY - 50;

      ctx.fillStyle = isHookAtDrop ? 'rgba(6, 78, 59, 0.95)' : 'rgba(15, 23, 42, 0.92)';
      ctx.fillRect(signX, signY, signW, signH);
      ctx.strokeStyle = isHookAtDrop ? '#00ff88' : '#10b981';
      ctx.lineWidth = 1.8;
      ctx.strokeRect(signX, signY, signW, signH);

      // Signboard Text
      ctx.fillStyle = isHookAtDrop ? '#00ff88' : '#34d399';
      ctx.font = 'bold 9.5px system-ui';
      ctx.textAlign = 'center';
      const mainTitle = isHookAtDrop
        ? '🎯 DROP YOUR LOAD NOW! (ROOFTOP SAFE ZONE)'
        : `🎯 ROOFTOP SAFE LANDING ZONE (TOP OF BUILDING)`;
      ctx.fillText(mainTitle, (deckLeft + deckRight) / 2, signY + 12);

      ctx.fillStyle = '#f8fafc';
      ctx.font = 'bold 7.5px monospace';
      const deckSub = this.hideFigures
        ? (isHookAtDrop ? 'RELEASE CONTROLS & CLICK CALL SLINGER' : 'SAFE ZONE ON TOP OF BUILDING')
        : `ROOFTOP: R: 20m-42m | θ: 75°-195° | H: 16m-28m`;
      ctx.fillText(deckSub, (deckLeft + deckRight) / 2, signY + 23);

      // Downward pointer arrow connecting signboard to landing deck
      ctx.fillStyle = isHookAtDrop ? '#00ff88' : '#10b981';
      ctx.beginPath();
      ctx.moveTo((deckLeft + deckRight) / 2 - 5, signY + signH);
      ctx.lineTo((deckLeft + deckRight) / 2 + 5, signY + signH);
      ctx.lineTo((deckLeft + deckRight) / 2, signY + signH + 6);
      ctx.closePath();
      ctx.fill();
    }

    // Render Delivered Loads Resting Permanently on Slabs
    this.deliveredLoads.forEach((dl) => {
      const landingY = meterToY(dl.deliveredHeightM || dl.target.heightM);
      const landingX = scaleX(dl.deliveredRadiusM || dl.target.radiusM);

      this.renderPayloadModel(ctx, landingX, landingY - 3, dl, false);

      ctx.fillStyle = '#10b981';
      ctx.font = 'bold 7px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(`✓ ${dl.name.split(' ')[0]} (${dl.massTonnes}t)`, landingX, landingY - 20);
    });

    // # -------------------------------------------------------------
    // # 3D TOWER CRANE: LATTICE MAST, CAB, JIB & MACHINERY APEX
    // # -------------------------------------------------------------
    // # 1. 3D Mast Rear Shadow Chords & Depth Face
    ctx.fillStyle = '#451a03';
    ctx.fillRect(mastX + mastW, mastTopY + mastDepth, mastDepth, groundY - mastTopY - mastDepth);

    // # 2. 3D Mast Main Face (Safety Yellow with Lattice Cross-Bracing)
    ctx.fillStyle = 'rgba(15, 23, 42, 0.95)';
    ctx.strokeStyle = '#eab308';
    ctx.lineWidth = 3;
    ctx.fillRect(mastX, mastTopY, mastW, groundY - mastTopY);
    ctx.strokeRect(mastX, mastTopY, mastW, groundY - mastTopY);

    // 3D Diagonal Lattice Webbing (Tubular Steel Trusses)
    ctx.strokeStyle = '#ca8a04';
    ctx.lineWidth = 1.6;
    for (let my = mastTopY; my < groundY - 6; my += 20) {
      // Front face diagonals
      ctx.beginPath();
      ctx.moveTo(mastX, my);
      ctx.lineTo(mastX + mastW, my + 20);
      ctx.moveTo(mastX + mastW, my);
      ctx.lineTo(mastX, my + 20);
      ctx.stroke();

      // Horizontal battens
      ctx.beginPath();
      ctx.moveTo(mastX, my);
      ctx.lineTo(mastX + mastW, my);
      ctx.stroke();

      // 3D Depth diagonals (side shadow face)
      ctx.strokeStyle = '#854d0e';
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(mastX + mastW, my);
      ctx.lineTo(mastX + mastW + mastDepth, my + mastDepth);
      ctx.lineTo(mastX + mastW, my + 20);
      ctx.stroke();
      ctx.strokeStyle = '#ca8a04';
      ctx.lineWidth = 1.6;
    }

    // Internal Safety Climbing Ladder Rail
    ctx.strokeStyle = '#fef08a';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(mastX + mastW / 2, mastTopY);
    ctx.lineTo(mastX + mastW / 2, groundY);
    ctx.stroke();

    // 3D Foundation Anchor Stools (Heavy Steel Footing into Concrete)
    ctx.fillStyle = '#1e293b';
    ctx.strokeStyle = '#94a3b8';
    ctx.lineWidth = 2;
    ctx.fillRect(mastX - 4, groundY - 8, mastW + mastDepth + 8, 8);
    ctx.strokeRect(mastX - 4, groundY - 8, mastW + mastDepth + 8, 8);

    // # 3. 3D Slewing Unit Bearing Ring at 34m
    const slewRingY = meterToY(34.2);
    ctx.fillStyle = '#334155';
    ctx.strokeStyle = '#eab308';
    ctx.lineWidth = 2.5;
    ctx.fillRect(mastX - 4, slewRingY, mastW + mastDepth + 8, 8);
    ctx.strokeRect(mastX - 4, slewRingY, mastW + mastDepth + 8, 8);

    // # 4. 3D Panoramic Operator Cab at 33.5m - 35.5m (Right Flank of Mast)
    const cabY = meterToY(35.5);
    const cabW = 22;
    const cabH = 20;
    const cabX = mastX + mastW + 2;

    // Cab Body (Safety Yellow with 3D Depth Roof)
    ctx.fillStyle = '#eab308';
    ctx.fillRect(cabX, cabY, cabW, cabH);
    ctx.strokeStyle = '#0f172a';
    ctx.lineWidth = 1.8;
    ctx.strokeRect(cabX, cabY, cabW, cabH);

    // Cab 3D Roof Sun-Visor Overhang
    ctx.fillStyle = '#ca8a04';
    ctx.fillRect(cabX - 2, cabY - 3, cabW + 5, 4);

    // Cab Tinted Panoramic Windows (Cyan glass with sunlight reflection)
    ctx.fillStyle = 'rgba(56, 189, 248, 0.45)';
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 1.2;
    ctx.fillRect(cabX + 3, cabY + 3, cabW - 6, cabH - 7);
    ctx.strokeRect(cabX + 3, cabY + 3, cabW - 6, cabH - 7);

    // Windshield White Glare Stripe
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.6)';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(cabX + 5, cabY + cabH - 6);
    ctx.lineTo(cabX + cabW - 5, cabY + 5);
    ctx.stroke();

    // High-Vis Crane Operator Figure Inside Cab
    ctx.fillStyle = '#f97316'; // Orange high-vis jacket
    ctx.beginPath();
    ctx.arc(cabX + 10, cabY + 9, 3.5, 0, Math.PI * 2);
    ctx.fill();

    // # 5. 3D Cat-Head Apex Tower (A-Frame Rising to 39m)
    const catHeadApexY = meterToY(39.0);
    const catHeadCenterX = mastX + mastW / 2;

    // Rear A-Frame Chord
    ctx.strokeStyle = '#ca8a04';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(mastX + mastW, mastTopY);
    ctx.lineTo(catHeadCenterX, catHeadApexY);
    ctx.stroke();

    // Front A-Frame Chord
    ctx.strokeStyle = '#eab308';
    ctx.lineWidth = 3.2;
    ctx.beginPath();
    ctx.moveTo(mastX, mastTopY);
    ctx.lineTo(catHeadCenterX, catHeadApexY);
    ctx.stroke();

    // Apex Aircraft Warning Pulsing Red Beacon Light
    ctx.fillStyle = '#ef4444';
    ctx.beginPath();
    ctx.arc(catHeadCenterX, catHeadApexY - 3, 3.5, 0, Math.PI * 2);
    ctx.fill();

    // # 6. 3D Counter-Jib Structure & Concrete Ballast Blocks (Extending Leftwards)
    const counterJibLengthPx = Math.min(105, Math.max(70, (mastX - (shedX + shedW)) * 0.9));
    const counterTipX = mastX - counterJibLengthPx;
    const jibBeamY = mastTopY;

    // Counter-Jib Steel Truss Box
    ctx.strokeStyle = '#eab308';
    ctx.lineWidth = 3.5;
    ctx.beginPath();
    ctx.moveTo(mastX, jibBeamY);
    ctx.lineTo(counterTipX, jibBeamY);
    ctx.moveTo(mastX, jibBeamY + 7);
    ctx.lineTo(counterTipX, jibBeamY + 7);
    ctx.stroke();

    // Counter-Jib Tie Pendants from Cathead Apex
    ctx.strokeStyle = '#94a3b8';
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.moveTo(catHeadCenterX, catHeadApexY);
    ctx.lineTo(counterTipX + 18, jibBeamY);
    ctx.stroke();

    // 3D Concrete Counterweight Ballast Blocks (12.0t Total Ballast)
    const ballastW = 32;
    const ballastH = 18;
    const ballastDepth = 4;

    // Ballast 3D Depth Shadow Top & Side
    ctx.fillStyle = '#334155';
    ctx.fillRect(counterTipX - ballastDepth, jibBeamY - 5 - ballastDepth, ballastW, ballastDepth);

    // Ballast Front Face (Textured Reinforced Concrete)
    ctx.fillStyle = '#64748b';
    ctx.fillRect(counterTipX, jibBeamY - 5, ballastW, ballastH);
    ctx.strokeStyle = '#94a3b8';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(counterTipX, jibBeamY - 5, ballastW, ballastH);

    ctx.fillStyle = '#f8fafc';
    ctx.font = 'bold 7px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('12t BALLAST', counterTipX + ballastW / 2, jibBeamY + 7);

    // # 7. 3D Working Jib Triangular Truss (Extending Rightwards)
    // Upper Tension Chord (Yellow Tubular Steel)
    ctx.strokeStyle = '#eab308';
    ctx.lineWidth = 3.0;
    ctx.beginPath();
    ctx.moveTo(jibStartX, jibBeamY - 10);
    ctx.lineTo(jibEndX - 24, jibBeamY);
    ctx.stroke();

    // Lower Working Trolley Track Chords (Dual Tubular Flanges)
    ctx.strokeStyle = '#ca8a04';
    ctx.lineWidth = 2.0;
    ctx.beginPath();
    ctx.moveTo(jibStartX, jibBeamY);
    ctx.lineTo(jibEndX, jibBeamY);
    ctx.stroke();

    ctx.strokeStyle = '#eab308';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(jibStartX, jibBeamY + 5);
    ctx.lineTo(jibEndX, jibBeamY + 5);
    ctx.stroke();

    // 3D Diagonal Truss Webbing along Jib
    ctx.strokeStyle = '#ca8a04';
    ctx.lineWidth = 1.3;
    for (let jx = jibStartX; jx < jibEndX - 20; jx += 18) {
      ctx.beginPath();
      ctx.moveTo(jx, jibBeamY + 5);
      ctx.lineTo(jx + 9, jibBeamY - 10 * (1 - (jx - jibStartX) / (jibEndX - jibStartX)));
      ctx.lineTo(jx + 18, jibBeamY + 5);
      ctx.stroke();
    }

    // Main Jib Pendant Stay Ropes from Cathead Apex to Jib
    ctx.strokeStyle = '#94a3b8';
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.moveTo(catHeadCenterX, catHeadApexY);
    ctx.lineTo(scaleX(20.0), jibBeamY - 6);
    ctx.moveTo(catHeadCenterX, catHeadApexY);
    ctx.lineTo(scaleX(35.0), jibBeamY - 2);
    ctx.stroke();

    // # -------------------------------------------------------------
    // # 3D Trolley Carriage & Wheels (Running on Lower Jib Flange)
    // # -------------------------------------------------------------
    const trolleyElevationX = scaleX(this.trolleyRadiusM);
    const trolleyElevationY = jibBeamY + 5;

    // 3D Trolley Body (Machinery Blue)
    ctx.fillStyle = '#0284c7';
    ctx.fillRect(trolleyElevationX - 12, trolleyElevationY, 24, 10);
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(trolleyElevationX - 12, trolleyElevationY, 24, 10);

    // 4 Steel Trolley Wheels
    ctx.fillStyle = '#0f172a';
    [-9, 9].forEach(wx => {
      ctx.beginPath();
      ctx.arc(trolleyElevationX + wx, trolleyElevationY, 3.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#94a3b8';
      ctx.beginPath();
      ctx.arc(trolleyElevationX + wx, trolleyElevationY, 1.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#0f172a';
    });

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

    // # -------------------------------------------------------------
    // # Rigging Assembly: Hook Block with Slings OR Electro-Magnet Spreader Bar
    // # -------------------------------------------------------------
    ctx.save();
    ctx.translate(hookX, hookY);
    ctx.rotate(phiRad); // Rotate with pendulum angle

    const isMagnetMode = (this.riggingMode === 'ELECTRO_MAGNET' || this.riggingMode === 'MAGNET');

    if (isMagnetMode) {
      // # INDUSTRIAL ELECTRO-MAGNET SPREADER BAR (3D Beveled Design)
      const magW = 38;
      const magH = 12;
      
      // Heavy Steel Suspension Chains from hoist rope terminator to spreader bar
      ctx.strokeStyle = '#cbd5e1';
      ctx.lineWidth = 2.2;
      ctx.beginPath();
      ctx.moveTo(0, -8);
      ctx.lineTo(-magW / 2 + 5, 0);
      ctx.moveTo(0, -8);
      ctx.lineTo(magW / 2 - 5, 0);
      ctx.stroke();

      // Heavy Duty Steel Magnet Body with Metallic Chamfer
      ctx.fillStyle = '#0891b2';
      ctx.fillRect(-magW / 2, 0, magW, magH);
      ctx.strokeStyle = '#22d3ee';
      ctx.lineWidth = 2.0;
      ctx.strokeRect(-magW / 2, 0, magW, magH);

      // Top Highlight Bevel
      ctx.fillStyle = 'rgba(255, 255, 255, 0.45)';
      ctx.fillRect(-magW / 2 + 1, 1, magW - 2, 2);

      // Status Indicator LED (Amber when idle, Green when energized/carrying)
      const isEnergized = this.hasLoad || this.magnetEngaged;
      ctx.fillStyle = isEnergized ? '#22c55e' : '#f59e0b';
      ctx.beginPath();
      ctx.arc(0, magH / 2, 3.0, 0, Math.PI * 2);
      ctx.fill();

      // Glowing Cyan Magnetic Field Lines (when energized)
      if (isEnergized) {
        ctx.strokeStyle = 'rgba(34, 211, 238, 0.85)';
        ctx.lineWidth = 2.0;
        ctx.setLineDash([4, 2]);
        ctx.beginPath();
        ctx.ellipse(0, magH + 3, magW / 2 + 4, 6, 0, 0, Math.PI * 2);
        ctx.stroke();
        ctx.setLineDash([]);
      }

      // Suspended Load clamped directly to bottom magnet face plate
      if (this.hasLoad && currentLoad) {
        this.renderPayloadModel(ctx, 0, magH + 1, currentLoad, true);
      }
    } else {
      // # 3D TWIN-SHEAVE INDUSTRIAL HOOK BLOCK & HEAVY FORGED HOOK
      const blockW = 24;
      const blockH = 22;

      // 3D Block Housing (Yellow Safety Enamel with beveled edges)
      ctx.fillStyle = '#eab308';
      ctx.fillRect(-blockW / 2, -blockH / 2, blockW, blockH);
      ctx.strokeStyle = '#0f172a';
      ctx.lineWidth = 1.8;
      ctx.strokeRect(-blockW / 2, -blockH / 2, blockW, blockH);

      // 3D Metallic Bevel highlight on top & left
      ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
      ctx.fillRect(-blockW / 2 + 1, -blockH / 2 + 1, blockW - 2, 2);
      ctx.fillRect(-blockW / 2 + 1, -blockH / 2 + 1, 2, blockH - 2);

      // Hazard Chevron Stripes (High-Contrast Black & Yellow)
      ctx.fillStyle = '#0f172a';
      for (let hx = -blockW / 2 + 3; hx < blockW / 2; hx += 7) {
        ctx.beginPath();
        ctx.moveTo(hx, -blockH / 2);
        ctx.lineTo(hx + 5, -blockH / 2);
        ctx.lineTo(hx - 2, blockH / 2);
        ctx.lineTo(hx - 7, blockH / 2);
        ctx.closePath();
        ctx.fill();
      }

      // Center Sheave Pin / Bolt (Silver with inner shadow)
      ctx.fillStyle = '#64748b';
      ctx.beginPath();
      ctx.arc(0, 0, 4.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#e2e8f0';
      ctx.beginPath();
      ctx.arc(0, 0, 2.5, 0, Math.PI * 2);
      ctx.fill();

      // Swivel Neck & Shackle Pin below block
      ctx.fillStyle = '#475569';
      ctx.fillRect(-4, blockH / 2, 8, 5);

      // # HEAVY FORGED STEEL CRANE HOOK (Realistic Curved Profile)
      const hookCenterY = blockH / 2 + 12;
      const hookR = 8.5;

      // Outer Hook Body (Forged Steel Silver)
      ctx.strokeStyle = '#cbd5e1';
      ctx.lineWidth = 4.5;
      ctx.beginPath();
      ctx.arc(0, hookCenterY, hookR, -Math.PI * 0.7, Math.PI * 0.6);
      ctx.lineTo(hookR + 1, hookCenterY - 2);
      ctx.stroke();

      // Hook Shank & Tip Highlight
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(-1, hookCenterY - 1, hookR - 1, -Math.PI * 0.5, Math.PI * 0.4);
      ctx.stroke();

      // Safety Spring Latch (Safety Red)
      ctx.strokeStyle = '#ef4444';
      ctx.lineWidth = 2.0;
      ctx.beginPath();
      ctx.moveTo(-1, blockH / 2 + 5);
      ctx.lineTo(hookR - 2, hookCenterY - 1);
      ctx.stroke();

      // # Suspended Load with Heavy Rigging Slings
      if (this.hasLoad && currentLoad) {
        // Master Rigging Link / Shackle sitting securely inside the Hook Bowl
        const shackleY = hookCenterY + 4;
        ctx.strokeStyle = '#f59e0b';
        ctx.lineWidth = 3.0;
        ctx.beginPath();
        ctx.arc(0, shackleY, 4, 0, Math.PI * 2);
        ctx.stroke();

        // 4-Leg Heavy Braided Steel Slings from Shackle down to 4 Corner Lugs
        const slingBottomY = shackleY + 28;
        const spreadOuter = 26;
        const spreadInner = 10;

        // Slings (Double-pass with metallic sheen)
        ctx.strokeStyle = '#cbd5e1';
        ctx.lineWidth = 2.0;
        ctx.beginPath();
        // Leg 1 (Outer Left)
        ctx.moveTo(0, shackleY + 3);
        ctx.lineTo(-spreadOuter, slingBottomY);
        // Leg 2 (Inner Left)
        ctx.moveTo(0, shackleY + 3);
        ctx.lineTo(-spreadInner, slingBottomY);
        // Leg 3 (Inner Right)
        ctx.moveTo(0, shackleY + 3);
        ctx.lineTo(spreadInner, slingBottomY);
        // Leg 4 (Outer Right)
        ctx.moveTo(0, shackleY + 3);
        ctx.lineTo(spreadOuter, slingBottomY);
        ctx.stroke();

        // Bright Core Shimmer Line
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 0.8;
        ctx.stroke();

        // Heavy Alloy Sling Hooks at bottom corners latched into payload lugs
        ctx.fillStyle = '#eab308';
        [-spreadOuter, -spreadInner, spreadInner, spreadOuter].forEach(lx => {
          ctx.beginPath();
          ctx.arc(lx, slingBottomY, 2.5, 0, Math.PI * 2);
          ctx.fill();
        });

        // Render Suspended Payload Model
        this.renderPayloadModel(ctx, 0, slingBottomY + 2, currentLoad, true);

        // Heavy-Duty Tagline for Ground Crew Control
        ctx.strokeStyle = 'rgba(245, 158, 11, 0.85)';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(spreadOuter, slingBottomY + 16);
        ctx.lineTo(spreadOuter + 14, slingBottomY + 42);
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
      this.renderWorkerFigure(ctx, riggerX, riggerY, '#f97316', 'GROUND RIGGER ATTACHING SLINGS', false);
    } else if (this.crewState === 'ROOF_UNRIGGING' && currentLoad) {
      const targetSlabY = meterToY(currentLoad.target.heightM);
      const riggerX = scaleX(currentLoad.target.radiusM) + 18;
      const riggerY = targetSlabY - 3;
      this.renderWorkerFigure(ctx, riggerX, riggerY, '#00ff88', 'ROOF CREW UNHOOKING LOAD', true);
    } else if (this.hasLoad && currentLoad) {
      // # Station Roof Slinger on top of the building (rooftop safe zone) whenever carrying a payload
      // # User Directive: "THE LOAD SHOULD BE PLACED ON THE BUILDING ITSELF NOT THE FIFTH FLOOR ANYMORE"
      const targetSlabY = meterToY(currentLoad.target.heightM);
      const riggerX = bldgMinX + 18;
      const riggerY = targetSlabY - 3;
      const isAtFloor = this.isHookWithinTargetFloor();
      this.renderWorkerFigure(
        ctx,
        riggerX,
        riggerY,
        isAtFloor ? '#00ff88' : '#06b6d4',
        isAtFloor ? 'SAFE ZONE CLEAR! DROP LOAD HERE!' : 'ROOFTOP SLINGER',
        isAtFloor
      );
    }

    // # -------------------------------------------------------------
    // # Visual 3D Alignment Target Cone & Reticle (Rule 4)
    // # -------------------------------------------------------------
    this.renderAlignmentInterlockGuide(ctx, hookX, hookY, scaleX, meterToY, groundY, currentLoad);

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

    // Panel Header Badge (Panoramic Construction Site Digital Twin)
    ctx.textAlign = 'left';
    ctx.fillStyle = '#f8fafc';
    ctx.font = 'bold 12px system-ui';
    ctx.fillText('PANORAMIC 3D TOWER CRANE SIMULATION DECK (6-STORY ABUJA SITE)', x + 16, y + 22);
    ctx.fillStyle = '#38bdf8';
    ctx.font = '10px monospace';
    const loadDesc = this.hasLoad && currentLoad ? `${currentLoad.name} (${currentLoad.massTonnes}t)` : 'EMPTY HOOK';
    if (!this.hideFigures) {
      ctx.fillText(`BEARING (θ): ${this.slewAngleDeg.toFixed(1)}° | RADIUS (r): ${this.trolleyRadiusM.toFixed(1)}m | HOOK (z): ${this.hookElevationM.toFixed(1)}m | SWAY: ${this.pendulumRadialDeg.toFixed(1)}° | RIGGING: ${this.riggingMode} | ${loadDesc}`, x + 16, y + 37);
    } else {
      ctx.fillText(`STATUS: ${loadDesc} | RIGGING: ${this.riggingMode}`, x + 16, y + 37);
    }
  }

  // # Function: Render Realistic Payload Geometry with Lifting Lugs & Top Plates
  renderPayloadModel(ctx, px, py, load, isSuspended) {
    if (!load) return;
    ctx.save();
    if (isSuspended) {
      // py is the top attachment level (where slings or magnet face connect)
      if (load.id === 'LOAD_1_REBAR') {
        // Cylindrical Rebar Bundles with Steel Straps & Corner Lifting Lugs
        const w = 52;
        const h = 18;
        ctx.fillStyle = '#38bdf8';
        ctx.fillRect(-w / 2, py, w, h);
        ctx.strokeStyle = '#0284c7';
        ctx.lineWidth = 1.8;
        ctx.strokeRect(-w / 2, py, w, h);

        // Rebar longitudinal rib lines (Textured Bundles)
        ctx.strokeStyle = '#0f172a';
        ctx.lineWidth = 1.2;
        for (let ry = py + 3; ry < py + h; ry += 3.5) {
          ctx.beginPath();
          ctx.moveTo(-w / 2, ry);
          ctx.lineTo(w / 2, ry);
          ctx.stroke();
        }

        // Heavy steel strapping bands (Silver)
        ctx.fillStyle = '#e2e8f0';
        ctx.fillRect(-w / 2 + 8, py - 1, 4, h + 2);
        ctx.fillRect(w / 2 - 12, py - 1, 4, h + 2);

        // 4 Steel Lifting Lugs / Padeyes on top where the 4 sling hooks latch
        ctx.fillStyle = '#475569';
        ctx.strokeStyle = '#e2e8f0';
        ctx.lineWidth = 1.2;
        [-26, -10, 10, 26].forEach(lx => {
          ctx.beginPath();
          ctx.arc(lx, py - 1, 3.5, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();
        });

        // Payload Text Label
        ctx.fillStyle = '#0f172a';
        ctx.font = 'bold 8px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(`REBAR 2.4t`, 0, py + 12);
      } else if (load.id === 'LOAD_2_PRECAST_BEAM') {
        // Precast Concrete I-Beam Profile
        const w = 56;
        const h = 20;
        ctx.fillStyle = '#fbbf24';
        ctx.fillRect(-w / 2, py, w, h);
        ctx.strokeStyle = '#d97706';
        ctx.lineWidth = 1.8;
        ctx.strokeRect(-w / 2, py, w, h);

        // I-Beam Top & Bottom Flanges
        ctx.fillStyle = '#b45309';
        ctx.fillRect(-w / 2, py, w, 4);
        ctx.fillRect(-w / 2, py + h - 4, w, 4);

        // 4 Corner Lifting Lug Loops
        ctx.strokeStyle = '#cbd5e1';
        ctx.lineWidth = 2.0;
        [-26, -10, 10, 26].forEach(lx => {
          ctx.strokeRect(lx - 2.5, py - 4, 5, 4);
        });

        // Payload Text Label
        ctx.fillStyle = '#0f172a';
        ctx.font = 'bold 8px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(`BEAM 3.5t`, 0, py + 13);
      } else {
        // Industrial HVAC Chiller / Generator Unit
        const w = 46;
        const h = 22;
        ctx.fillStyle = '#c084fc';
        ctx.fillRect(-w / 2, py, w, h);
        ctx.strokeStyle = '#9333ea';
        ctx.lineWidth = 1.8;
        ctx.strokeRect(-w / 2, py, w, h);

        // Louver vents
        ctx.fillStyle = '#581c87';
        for (let ly = py + 5; ly < py + h - 4; ly += 3.5) {
          ctx.fillRect(-w / 2 + 5, ly, 18, 1.8);
        }

        // Top Cooling Fan Grille & Striker Plate
        ctx.fillStyle = '#3b0764';
        ctx.beginPath();
        ctx.arc(w / 2 - 10, py + 8, 5, 0, Math.PI * 2);
        ctx.fill();

        // 4 Corner Lifting Padeyes
        ctx.fillStyle = '#e2e8f0';
        ctx.strokeStyle = '#64748b';
        ctx.lineWidth = 1.2;
        [-23, -10, 10, 23].forEach(lx => {
          ctx.beginPath();
          ctx.arc(lx, py - 1, 3.5, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();
        });

        // Payload Text Label
        ctx.fillStyle = '#0f172a';
        ctx.font = 'bold 8px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(`CHILLER ${load.massTonnes}t`, 0, py + 15);
      }
    } else {
      // py is ground or slab baseline (load sits above py)
      const baseW = 38;
      const baseH = 16;
      ctx.fillStyle = load.color;
      ctx.fillRect(px - baseW / 2, py - baseH, baseW, baseH);
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(px - baseW / 2, py - baseH, baseW, baseH);

      // Top corner lifting lugs
      ctx.fillStyle = '#475569';
      ctx.fillRect(px - baseW / 2 + 4, py - baseH - 4, 6, 4);
      ctx.fillRect(px + baseW / 2 - 10, py - baseH - 4, 6, 4);

      // Label
      ctx.fillStyle = '#0f172a';
      ctx.font = 'bold 7px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(`${load.name.split(' ')[0]}`, px, py - 8);
      ctx.fillText(`${load.massTonnes}t`, px, py - 2);
    }
    ctx.restore();
  }

  // # Function: Render Rooftop Safe Landing Zone Matching Payload Geometry Drawn With Lines (Top of Building)
  // # User Directive: "THE LOAD SHOULD BE PLACED ON THE BUILDING ITSELF NOT THE FIFTH FLOOR ANYMORE"
  // # "AND ALSO A SHAPE SIMILAR IN SIZE AS THE LOAD SHOULD BE DRAWN WITH LINES ON THE TOP OF THE BUILDING SIGNIFYING THE SAFE ZONE TO PLACE THE LOAD"
  renderPayloadLandingCradle(ctx, cx, cy, load, isAtDrop) {
    if (!load) return;
    ctx.save();
    const now = performance.now();

    // Line colors: neon emerald (#00ff88) if load is hovering in safe zone, vibrant emerald (#10b981) otherwise
    const lineColor = isAtDrop ? '#00ff88' : '#10b981';
    const subLineColor = isAtDrop ? 'rgba(0, 255, 136, 0.75)' : 'rgba(16, 185, 129, 0.65)';
    const haloFill = isAtDrop ? 'rgba(0, 255, 136, 0.16)' : 'rgba(16, 185, 129, 0.08)';

    // # 1. Hardwood Timber Dunnage Sleepers on Rooftop Slab Surface
    // Real crane operations require timbers on roof slab to protect concrete and allow sling removal
    ctx.fillStyle = '#78350f';
    ctx.strokeStyle = '#92400e';
    ctx.lineWidth = 1;
    ctx.fillRect(cx - 26, cy - 4, 12, 4);
    ctx.strokeRect(cx - 26, cy - 4, 12, 4);
    ctx.fillRect(cx + 14, cy - 4, 12, 4);
    ctx.strokeRect(cx + 14, cy - 4, 12, 4);

    let w, h, topY;

    // # 2. Shape Similar in Size as the Load DRAWN WITH LINES on Top of the Building
    if (load.id === 'LOAD_1_REBAR') {
      // -----------------------------------------------------------------
      // REBAR BUNDLE WIREFRAME (Matches 52x18 Suspended Rebar Bundle)
      // -----------------------------------------------------------------
      w = 52;
      h = 18;
      topY = cy - 4 - h;

      // Soft landing zone backing tint
      ctx.fillStyle = haloFill;
      ctx.fillRect(cx - w / 2, topY, w, h);

      // Outer Perimeter Line Box
      ctx.strokeStyle = lineColor;
      ctx.lineWidth = isAtDrop ? 2.5 : 1.8;
      ctx.strokeRect(cx - w / 2, topY, w, h);

      // Rebar Longitudinal Flute Lines (Drawn with lines across the bundle)
      ctx.strokeStyle = subLineColor;
      ctx.lineWidth = 1.2;
      for (let ry = topY + 3.5; ry < topY + h - 1; ry += 3.5) {
        ctx.beginPath();
        ctx.moveTo(cx - w / 2 + 2, ry);
        ctx.lineTo(cx + w / 2 - 2, ry);
        ctx.stroke();
      }

      // 2 Steel Strapping Bands Drawn with Paired Vertical Lines
      ctx.strokeStyle = isAtDrop ? '#00ff88' : '#e2e8f0';
      ctx.lineWidth = 1.6;
      ctx.strokeRect(cx - w / 2 + 8, topY - 1, 4, h + 2);
      ctx.strokeRect(cx + w / 2 - 12, topY - 1, 4, h + 2);

      // Center Crosshair Lines (+)
      ctx.strokeStyle = isAtDrop ? 'rgba(0, 255, 136, 0.6)' : 'rgba(16, 185, 129, 0.4)';
      ctx.lineWidth = 1;
      ctx.setLineDash([3, 2]);
      ctx.beginPath();
      ctx.moveTo(cx, topY);
      ctx.lineTo(cx, topY + h);
      ctx.moveTo(cx - w / 2, topY + h / 2);
      ctx.lineTo(cx + w / 2, topY + h / 2);
      ctx.stroke();
      ctx.setLineDash([]);

      // 4 Lifting Lug Docking Semicircles at [-26, -10, 10, 26]
      [-26, -10, 10, 26].forEach((lx) => {
        const lugX = cx + lx;
        ctx.strokeStyle = isAtDrop ? '#00ff88' : '#94a3b8';
        ctx.lineWidth = 1.8;
        ctx.beginPath();
        ctx.arc(lugX, topY, 3.5, 0, Math.PI); // Half-circle cradle cup
        ctx.stroke();

        // Vertical laser alignment ray upward to meet suspended load overhead
        if (isAtDrop) {
          ctx.strokeStyle = 'rgba(0, 255, 136, 0.85)';
          ctx.lineWidth = 1.5;
          ctx.setLineDash([4, 3]);
          ctx.lineDashOffset = -(now * 0.05) % 7;
          ctx.beginPath();
          ctx.moveTo(lugX, topY);
          ctx.lineTo(lugX, topY - 36);
          ctx.stroke();
          ctx.setLineDash([]);
        }
      });

    } else if (load.id === 'LOAD_2_PRECAST_BEAM') {
      // -----------------------------------------------------------------
      // PRECAST BEAM WIREFRAME (Matches 56x20 I-Beam Profile)
      // -----------------------------------------------------------------
      w = 56;
      h = 20;
      topY = cy - 4 - h;

      // Soft landing zone backing tint
      ctx.fillStyle = haloFill;
      ctx.fillRect(cx - w / 2, topY, w, h);

      // Outer Perimeter Line Box
      ctx.strokeStyle = lineColor;
      ctx.lineWidth = isAtDrop ? 2.5 : 1.8;
      ctx.strokeRect(cx - w / 2, topY, w, h);

      // Top & Bottom Flange Lines (I-Beam Profile Drawn with Lines)
      ctx.strokeStyle = subLineColor;
      ctx.lineWidth = 1.5;
      // Top Flange lower edge line
      ctx.beginPath();
      ctx.moveTo(cx - w / 2, topY + 4);
      ctx.lineTo(cx + w / 2, topY + 4);
      // Bottom Flange upper edge line
      ctx.moveTo(cx - w / 2, topY + h - 4);
      ctx.lineTo(cx + w / 2, topY + h - 4);
      ctx.stroke();

      // Web Centerline & Diagonal Truss Lines Across the Beam Web
      ctx.strokeStyle = isAtDrop ? 'rgba(0, 255, 136, 0.55)' : 'rgba(251, 191, 36, 0.45)';
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      for (let tx = cx - w / 2 + 7; tx < cx + w / 2 - 7; tx += 10) {
        ctx.moveTo(tx, topY + 4);
        ctx.lineTo(tx + 5, topY + h - 4);
        ctx.lineTo(tx + 10, topY + 4);
      }
      ctx.stroke();

      // Center Crosshair Lines (+)
      ctx.strokeStyle = isAtDrop ? 'rgba(0, 255, 136, 0.6)' : 'rgba(16, 185, 129, 0.4)';
      ctx.lineWidth = 1;
      ctx.setLineDash([3, 2]);
      ctx.beginPath();
      ctx.moveTo(cx, topY);
      ctx.lineTo(cx, topY + h);
      ctx.stroke();
      ctx.setLineDash([]);

      // 4 Lifting Loop Rectangles at [-26, -10, 10, 26]
      [-26, -10, 10, 26].forEach((lx) => {
        const loopX = cx + lx;
        ctx.strokeStyle = isAtDrop ? '#00ff88' : '#cbd5e1';
        ctx.lineWidth = 2.0;
        ctx.strokeRect(loopX - 2.5, topY - 4, 5, 4);

        if (isAtDrop) {
          ctx.strokeStyle = 'rgba(0, 255, 136, 0.85)';
          ctx.lineWidth = 1.5;
          ctx.setLineDash([4, 3]);
          ctx.lineDashOffset = -(now * 0.05) % 7;
          ctx.beginPath();
          ctx.moveTo(loopX, topY - 4);
          ctx.lineTo(loopX, topY - 36);
          ctx.stroke();
          ctx.setLineDash([]);
        }
      });

    } else {
      // -----------------------------------------------------------------
      // HVAC CHILLER UNIT WIREFRAME (Matches 46x22 Chiller Unit)
      // -----------------------------------------------------------------
      w = 46;
      h = 22;
      topY = cy - 4 - h;

      // Soft landing zone backing tint
      ctx.fillStyle = haloFill;
      ctx.fillRect(cx - w / 2, topY, w, h);

      // Outer Perimeter Line Box
      ctx.strokeStyle = lineColor;
      ctx.lineWidth = isAtDrop ? 2.5 : 1.8;
      ctx.strokeRect(cx - w / 2, topY, w, h);

      // Left Section: 5 Louver Grille Lines
      ctx.strokeStyle = subLineColor;
      ctx.lineWidth = 1.4;
      for (let ly = topY + 5; ly < topY + h - 3; ly += 3.5) {
        ctx.beginPath();
        ctx.moveTo(cx - w / 2 + 4, ly);
        ctx.lineTo(cx - 2, ly);
        ctx.stroke();
      }

      // Middle Vertical Divider Line
      ctx.beginPath();
      ctx.moveTo(cx, topY + 2);
      ctx.lineTo(cx, topY + h - 2);
      ctx.stroke();

      // Right Section: Concentric Fan Circular Lines & Radial Spoke Lines
      const fanX = cx + w / 2 - 11;
      const fanY = topY + 8;
      ctx.strokeStyle = isAtDrop ? '#00ff88' : '#c084fc';
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.arc(fanX, fanY, 5.5, 0, Math.PI * 2);
      ctx.stroke();
      // Fan spoke lines (+)
      ctx.beginPath();
      ctx.moveTo(fanX - 5.5, fanY);
      ctx.lineTo(fanX + 5.5, fanY);
      ctx.moveTo(fanX, fanY - 5.5);
      ctx.lineTo(fanX, fanY + 5.5);
      ctx.stroke();

      // 4 Corner Padeye Receptacles at [-23, -10, 10, 23]
      [-23, -10, 10, 23].forEach((lx) => {
        const padX = cx + lx;
        ctx.strokeStyle = isAtDrop ? '#00ff88' : '#94a3b8';
        ctx.lineWidth = 1.8;
        ctx.beginPath();
        ctx.arc(padX, topY, 3.5, 0, Math.PI);
        ctx.stroke();

        if (isAtDrop) {
          ctx.strokeStyle = 'rgba(0, 255, 136, 0.85)';
          ctx.lineWidth = 1.5;
          ctx.setLineDash([4, 3]);
          ctx.lineDashOffset = -(now * 0.05) % 7;
          ctx.beginPath();
          ctx.moveTo(padX, topY);
          ctx.lineTo(padX, topY - 36);
          ctx.stroke();
          ctx.setLineDash([]);
        }
      });
    }

    // # 3. Heavy 4-Corner L-Bracket Boundary Lines Framing the Safe Landing Zone
    const bW = w + 10;
    const bH = h + 8;
    const bTop = topY - 4;
    const bBottom = cy - 4;
    const bSize = 7;
    ctx.strokeStyle = lineColor;
    ctx.lineWidth = 3.2;

    // Top-Left L-Bracket
    ctx.beginPath();
    ctx.moveTo(cx - bW / 2, bTop + bSize);
    ctx.lineTo(cx - bW / 2, bTop);
    ctx.lineTo(cx - bW / 2 + bSize, bTop);
    ctx.stroke();

    // Top-Right L-Bracket
    ctx.beginPath();
    ctx.moveTo(cx + bW / 2 - bSize, bTop);
    ctx.lineTo(cx + bW / 2, bTop);
    ctx.lineTo(cx + bW / 2, bTop + bSize);
    ctx.stroke();

    // Bottom-Left L-Bracket
    ctx.beginPath();
    ctx.moveTo(cx - bW / 2, bBottom - bSize);
    ctx.lineTo(cx - bW / 2, bBottom);
    ctx.lineTo(cx - bW / 2 + bSize, bBottom);
    ctx.stroke();

    // Bottom-Right L-Bracket
    ctx.beginPath();
    ctx.moveTo(cx + bW / 2 - bSize, bBottom);
    ctx.lineTo(cx + bW / 2, bBottom);
    ctx.lineTo(cx + bW / 2, bBottom - bSize);
    ctx.stroke();

    // Outer Dashed Safety Zone Boundary Line
    ctx.strokeStyle = isAtDrop ? 'rgba(0, 255, 136, 0.85)' : 'rgba(16, 185, 129, 0.45)';
    ctx.lineWidth = 1.5;
    ctx.setLineDash([6, 4]);
    ctx.strokeRect(cx - bW / 2, bTop, bW, bBottom - bTop);
    ctx.setLineDash([]);

    // Line-Bordered Safe Zone Badge on Top of the Building
    const badgeW = 140;
    const badgeH = 14;
    const badgeY = topY - 18;
    ctx.fillStyle = isAtDrop ? 'rgba(6, 78, 59, 0.95)' : 'rgba(15, 23, 42, 0.85)';
    ctx.fillRect(cx - badgeW / 2, badgeY, badgeW, badgeH);
    ctx.strokeStyle = lineColor;
    ctx.lineWidth = 1.5;
    ctx.strokeRect(cx - badgeW / 2, badgeY, badgeW, badgeH);

    ctx.fillStyle = isAtDrop ? '#00ff88' : '#34d399';
    ctx.font = 'bold 7.5px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('🟢 SAFE ZONE TO PLACE LOAD', cx, badgeY + 10);

    // Dynamic Pulsing Sonar Landing Rings along the Rooftop Slab
    if (isAtDrop) {
      const pulsePhase = (now % 1200) / 1200;
      const pulseR = 24 + pulsePhase * 32;
      const pulseAlpha = Math.max(0, 1 - pulsePhase);
      ctx.strokeStyle = `rgba(0, 255, 136, ${pulseAlpha.toFixed(2)})`;
      ctx.lineWidth = 2.0;
      ctx.beginPath();
      ctx.ellipse(cx, cy - 4, pulseR, pulseR * 0.35, 0, 0, Math.PI * 2);
      ctx.stroke();
    }

    ctx.restore();
  }

  // # Function: Render High-Vis Construction Worker Figure (Ground & Roof Riggers)
  renderWorkerFigure(ctx, wx, wy, vestColor, label, isGreenPop = false) {
    ctx.save();
    const now = performance.now();

    // # 1. Ground Signal Beacon / Pulse Halo for Green Pop Signalling
    if (isGreenPop) {
      const pulsePhase = (now % 900) / 900;
      const pulseR = 12 + pulsePhase * 20;
      const alpha = Math.max(0, 1 - pulsePhase);
      ctx.strokeStyle = `rgba(0, 255, 136, ${alpha.toFixed(2)})`;
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.ellipse(wx, wy, pulseR, pulseR * 0.45, 0, 0, Math.PI * 2);
      ctx.stroke();

      // Ambient radial ground glow
      ctx.fillStyle = 'rgba(0, 255, 136, 0.22)';
      ctx.beginPath();
      ctx.arc(wx, wy - 18, 24, 0, Math.PI * 2);
      ctx.fill();
    }

    // # 2. Hardhat (Neon Green if Signalling, Safety Yellow otherwise)
    ctx.fillStyle = isGreenPop ? '#00ff88' : '#eab308';
    ctx.beginPath();
    ctx.arc(wx, wy - 26, 4, 0, Math.PI * 2);
    ctx.fill();

    // # 3. High-Vis Vest Body (Neon Green if Signalling)
    ctx.fillStyle = isGreenPop ? '#00ff88' : vestColor;
    ctx.fillRect(wx - 4, wy - 22, 8, 11);

    // Reflective Silver Safety Stripe
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(wx - 4, wy - 17, 8, 2);

    // Heavy Work Pants
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(wx - 3, wy - 11, 3, 11);
    ctx.fillRect(wx + 1, wy - 11, 3, 11);

    // # 4. Animated Arms & Marshalling Wands / Rigging Pose
    if (isGreenPop) {
      // Slinger waving high-vis green marshalling batons in the air!
      const wavePhase = Math.sin(now * 0.012) * 5;
      ctx.strokeStyle = '#00ff88';
      ctx.lineWidth = 2.5;

      // Left Arm raised up
      ctx.beginPath();
      ctx.moveTo(wx - 4, wy - 20);
      ctx.lineTo(wx - 10, wy - 30 + wavePhase);
      ctx.stroke();

      // Right Arm raised up
      ctx.beginPath();
      ctx.moveTo(wx + 4, wy - 20);
      ctx.lineTo(wx + 10, wy - 30 - wavePhase);
      ctx.stroke();

      // Marshalling Wands / Batons (Glowing Neon Emerald)
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 3.2;
      ctx.beginPath();
      ctx.moveTo(wx - 10, wy - 30 + wavePhase);
      ctx.lineTo(wx - 15, wy - 40 + wavePhase);
      ctx.moveTo(wx + 10, wy - 30 - wavePhase);
      ctx.lineTo(wx + 15, wy - 40 - wavePhase);
      ctx.stroke();

      // Glowing wand tips
      ctx.fillStyle = '#00ff88';
      ctx.beginPath();
      ctx.arc(wx - 15, wy - 40 + wavePhase, 3, 0, Math.PI * 2);
      ctx.arc(wx + 15, wy - 40 - wavePhase, 3, 0, Math.PI * 2);
      ctx.fill();

      // # 5. Prominent Floating Speech Pop Bubble: "DROP LOAD HERE! ALL CLEAR!"
      const bubbleW = 150;
      const bubbleH = 22;
      const bubbleX = wx - bubbleW / 2;
      const bubbleY = wy - 56;

      ctx.fillStyle = 'rgba(6, 78, 59, 0.96)';
      ctx.strokeStyle = '#00ff88';
      ctx.lineWidth = 2.0;
      ctx.fillRect(bubbleX, bubbleY, bubbleW, bubbleH);
      ctx.strokeRect(bubbleX, bubbleY, bubbleW, bubbleH);

      // Downward pointer arrow pointing to slinger
      ctx.fillStyle = '#00ff88';
      ctx.beginPath();
      ctx.moveTo(wx - 5, bubbleY + bubbleH);
      ctx.lineTo(wx + 5, bubbleY + bubbleH);
      ctx.lineTo(wx, bubbleY + bubbleH + 6);
      ctx.closePath();
      ctx.fill();

      // Speech bubble text
      ctx.fillStyle = '#00ff88';
      ctx.font = 'bold 9px system-ui';
      ctx.textAlign = 'center';
      ctx.fillText('🟢 "DROP LOAD HERE! ALL CLEAR!"', wx, bubbleY + 14);
    } else {
      // Standard static / rigging arm pose
      ctx.strokeStyle = vestColor;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(wx - 4, wy - 20);
      ctx.lineTo(wx - 12, wy - 26);
      ctx.stroke();

      // Status Badge
      const pct = Math.min(100, Math.round((this.crewTimer / this.crewDuration) * 100));
      ctx.fillStyle = vestColor;
      ctx.font = 'bold 8px system-ui';
      ctx.textAlign = 'center';
      if (this.crewState !== 'IDLE') {
        ctx.fillText(`${label} (${pct}%)`, wx, wy - 33);
      } else {
        ctx.fillText(label, wx, wy - 33);
      }
    }

    ctx.restore();
  }

  // # Function: Render 4-Axis Dynamic Alignment Target Cone & Reticle (Rule 4)
  renderAlignmentInterlockGuide(ctx, hookX, hookY, scaleX, meterToY, groundY, currentLoad) {
    const isPickupPhase = !this.hasLoad;
    let targetX, targetY, inPosition, atCoordinates, targetFloorName;

    if (isPickupPhase) {
      const pb = CRANE_PHYSICS_CONFIG.PICKUP_BAY;
      targetX = scaleX(pb.radiusM);
      targetY = groundY - 8;
      inPosition = this.isHookInPickupPosition();
      atCoordinates = inPosition;
      targetFloorName = 'GROUND 0m';
    } else {
      if (!currentLoad) return;
      const tz = currentLoad.target;
      targetX = scaleX(tz.radiusM);
      targetY = meterToY(tz.heightM);
      inPosition = this.isHookInDropPosition();
      atCoordinates = this.isHookAtDropCoordinates();
      targetFloorName = tz.floor.toUpperCase();
    }

    ctx.save();

    const boxHalfW = isPickupPhase ? 22 : 46;

    // # 1. Dynamic Alignment Guide Vector from Hook Block to Target Center
    if (inPosition) {
      // Solid Bright Emerald Green Alignment Line
      ctx.strokeStyle = '#10b981';
      ctx.lineWidth = 2.5;
      ctx.setLineDash([]);
      ctx.beginPath();
      ctx.moveTo(hookX, hookY + 8);
      ctx.lineTo(targetX, targetY - 4);
      ctx.stroke();

      // Pulsing Emerald Target Halo
      ctx.fillStyle = 'rgba(16, 185, 129, 0.22)';
      ctx.beginPath();
      ctx.arc(targetX, targetY - 5, boxHalfW + 6, 0, Math.PI * 2);
      ctx.fill();

      // Solid Bright Emerald Target Box (Enlarged Landing Bay)
      ctx.strokeStyle = '#10b981';
      ctx.lineWidth = 2.5;
      ctx.strokeRect(targetX - boxHalfW, targetY - 16, boxHalfW * 2, 22);

      // Heavy Reticle Corner Brackets
      const bSize = 6;
      ctx.lineWidth = 3.2;
      // Top-Left Bracket
      ctx.beginPath();
      ctx.moveTo(targetX - boxHalfW, targetY - 16 + bSize);
      ctx.lineTo(targetX - boxHalfW, targetY - 16);
      ctx.lineTo(targetX - boxHalfW + bSize, targetY - 16);
      ctx.stroke();
      // Top-Right Bracket
      ctx.beginPath();
      ctx.moveTo(targetX + boxHalfW - bSize, targetY - 16);
      ctx.lineTo(targetX + boxHalfW, targetY - 16);
      ctx.lineTo(targetX + boxHalfW, targetY - 16 + bSize);
      ctx.stroke();
      // Bottom-Left Bracket
      ctx.beginPath();
      ctx.moveTo(targetX - boxHalfW, targetY + 6 - bSize);
      ctx.lineTo(targetX - boxHalfW, targetY + 6);
      ctx.lineTo(targetX - boxHalfW + bSize, targetY + 6);
      ctx.stroke();
      // Bottom-Right Bracket
      ctx.beginPath();
      ctx.moveTo(targetX + boxHalfW - bSize, targetY + 6);
      ctx.lineTo(targetX + boxHalfW, targetY + 6);
      ctx.lineTo(targetX + boxHalfW, targetY + 6 - bSize);
      ctx.stroke();

      // "POSITION LOCKED - READY FOR SLINGER" Solid Bright Emerald Badge
      const badgeW = 230;
      const badgeH = 22;
      const badgeX = targetX - badgeW / 2;
      const badgeY = targetY - 44;

      ctx.fillStyle = '#065f46';
      ctx.strokeStyle = '#34d399';
      ctx.lineWidth = 2.0;
      ctx.fillRect(badgeX, badgeY, badgeW, badgeH);
      ctx.strokeRect(badgeX, badgeY, badgeW, badgeH);

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 9px system-ui';
      ctx.textAlign = 'center';
      ctx.fillText('🔒 POSITION LOCKED - READY FOR SLINGER', targetX, badgeY + 15);
    } else if (atCoordinates) {
      // # At exact 3D drop coordinates: Guide line solid bright cyan/green
      ctx.strokeStyle = '#00ff88';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(hookX, hookY + 8);
      ctx.lineTo(targetX, targetY - 4);
      ctx.stroke();

      // Glowing Cyan/Emerald Reticle Box (Enlarged)
      ctx.strokeStyle = '#00ff88';
      ctx.lineWidth = 2.5;
      ctx.strokeRect(targetX - boxHalfW, targetY - 16, boxHalfW * 2, 22);

      // "🎯 DROP YOUR LOAD! RELEASE JOYSTICKS" Badge
      const badgeW = 250;
      const badgeH = 22;
      const badgeX = targetX - badgeW / 2;
      const badgeY = targetY - 44;

      ctx.fillStyle = '#064e3b';
      ctx.strokeStyle = '#00ff88';
      ctx.lineWidth = 2.0;
      ctx.fillRect(badgeX, badgeY, badgeW, badgeH);
      ctx.strokeRect(badgeX, badgeY, badgeW, badgeH);

      ctx.fillStyle = '#00ff88';
      ctx.font = 'bold 9.5px system-ui';
      ctx.textAlign = 'center';
      ctx.fillText('🎯 DROP YOUR LOAD! (HOLD CONTROLS NEUTRAL)', targetX, badgeY + 15);
    } else {
      // Dashed Amber Alignment Guide Line
      ctx.strokeStyle = 'rgba(245, 158, 11, 0.7)';
      ctx.lineWidth = 1.6;
      ctx.setLineDash([5, 4]);
      ctx.beginPath();
      ctx.moveTo(hookX, hookY + 8);
      ctx.lineTo(targetX, targetY - 4);
      ctx.stroke();
      ctx.setLineDash([]);

      // Dashed Amber/Red Target Bounds Box (Enlarged)
      ctx.strokeStyle = 'rgba(245, 158, 11, 0.75)';
      ctx.lineWidth = 1.8;
      ctx.setLineDash([4, 3]);
      ctx.strokeRect(targetX - boxHalfW, targetY - 16, boxHalfW * 2, 22);
      ctx.setLineDash([]);

      // Live Offset Delta Label at Midpoint of Guide Vector
      const midX = (hookX + targetX) / 2;
      const midY = (hookY + targetY) / 2;

      let dR, dTheta, dH;
      if (isPickupPhase) {
        const pb = CRANE_PHYSICS_CONFIG.PICKUP_BAY;
        dR = (this.trolleyRadiusM - pb.radiusM);
        dTheta = this.shortestAngleDiff(this.slewAngleDeg, pb.angleDeg);
        dH = (this.hookElevationM - 2.0);
      } else {
        const tz = currentLoad.target;
        dR = (this.trolleyRadiusM - tz.radiusM);
        dTheta = this.shortestAngleDiff(this.slewAngleDeg, tz.angleDeg);
        dH = (this.hookElevationM - tz.heightM);
      }

      const deltaTag = `ΔR: ${dR > 0 ? '+' : ''}${dR.toFixed(1)}m | Δθ: ${dTheta > 0 ? '+' : ''}${dTheta.toFixed(0)}° | ΔH: ${dH > 0 ? '+' : ''}${dH.toFixed(1)}m`;
      ctx.font = 'bold 8px monospace';
      const textW = ctx.measureText(deltaTag).width;
      ctx.fillStyle = 'rgba(15, 23, 42, 0.9)';
      ctx.strokeStyle = '#f59e0b';
      ctx.lineWidth = 1;
      ctx.fillRect(midX - textW / 2 - 5, midY - 9, textW + 10, 16);
      ctx.strokeRect(midX - textW / 2 - 5, midY - 9, textW + 10, 16);

      ctx.fillStyle = '#fef08a';
      ctx.textAlign = 'center';
      ctx.fillText(deltaTag, midX, midY + 3);
    }

    ctx.restore();
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

  // # Function: Toggle Top-Down Circular Radar Map (Defaults to false for panoramic wide site)
  toggleRadarMap() {
    this.showRadarMap = !this.showRadarMap;
    return this.showRadarMap;
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

// ========================================================================
// # SECTION 4: SPOKEN VIRTUAL VOICE INSTRUCTOR (WEB SPEECH API & SUBTITLES)
// ========================================================================

class CraneVoiceInstructor {
  constructor() {
    this.speechSynth = typeof window !== 'undefined' && 'speechSynthesis' in window ? window.speechSynthesis : null;
    this.isMuted = false;
    this.transcriptionActive = true;
    this.lastSpokenText = '';
    this.lastSpokenCategory = '';
    this.cooldowns = {};
    this.voice = null;
    this.welcomeTriggered = false;

    // # Initialize Speech Synthesis Voice
    if (this.speechSynth) {
      this.initVoices();
      if (typeof window.speechSynthesis.onvoiceschanged !== 'undefined') {
        window.speechSynthesis.onvoiceschanged = () => this.initVoices();
      }
    }
  }

  // # Function: Select Clear English Speech Synthesis Voice
  initVoices() {
    if (!this.speechSynth) return;
    const voices = this.speechSynth.getVoices();
    this.voice =
      voices.find(v => v.lang.startsWith('en') && (v.name.includes('Natural') || v.name.includes('Neural') || v.name.includes('Google') || v.name.includes('Oliver') || v.name.includes('David'))) ||
      voices.find(v => v.lang.startsWith('en')) ||
      voices[0] || null;
  }

  // # Function: Speak Instruction through Web Speech API & update live UI subtitle banner
  speak(text, category = 'info', cooldownSeconds = 6, force = false) {
    const now = Date.now();
    if (!force && this.cooldowns[category] && (now - this.cooldowns[category] < cooldownSeconds * 1000)) {
      return;
    }

    this.cooldowns[category] = now;
    this.lastSpokenText = text;
    this.lastSpokenCategory = category;

    // # Update live on-screen subtitle banner immediately
    this.updateSubtitleDOM(text, category);

    // # Audio Speech via Web Speech API
    if (this.speechSynth && !this.isMuted && typeof SpeechSynthesisUtterance !== 'undefined') {
      try {
        if (typeof this.speechSynth.cancel === 'function') {
          this.speechSynth.cancel();
        }
        const utterance = new SpeechSynthesisUtterance(text);
        if (this.voice) utterance.voice = this.voice;
        utterance.rate = 1.0;
        utterance.pitch = 1.05;
        utterance.volume = 1.0;

        utterance.onstart = () => this.setWaveActive(true);
        utterance.onend = () => this.setWaveActive(false);
        utterance.onerror = () => this.setWaveActive(false);

        this.speechSynth.speak(utterance);
      } catch (err) {
        console.warn('[CraneVoiceInstructor] Speech synthesis error:', err);
      }
    }
  }

  // # Function: Toggle Mute
  toggleMute() {
    this.isMuted = !this.isMuted;
    if (this.isMuted && this.speechSynth) {
      this.speechSynth.cancel();
      this.setWaveActive(false);
    }
    const btn = document.getElementById('btn-voice-mute');
    if (btn) {
      btn.innerHTML = this.isMuted ? '🔇 Unmute Instructor' : '🔊 Mute Voice';
      btn.classList.toggle('muted', this.isMuted);
    }
    return this.isMuted;
  }

  // # Function: Repeat last instruction
  repeatLast() {
    if (this.lastSpokenText) {
      this.speak(this.lastSpokenText, this.lastSpokenCategory, 0, true);
    } else {
      this.speak("Operator, lower the empty hook to the Ground Pickup Bay at Radius 16 meters.", 'guide', 0, true);
    }
  }

  // # Function: Explain ASVAM Cockpit Controls
  explainControls() {
    this.speak("ASVAM Cab Controls: Left stick or W-A-S-D controls trolley radius and slew angle. Right stick or I-K controls hoist cable. Feather joysticks gently to keep sway under 3 degrees.", 'guide', 0, true);
  }

  // # Function: Toggle Live Speech Transcription Banner (Mobile Accessibility)
  toggleTranscription() {
    this.transcriptionActive = !this.transcriptionActive;
    const box = document.getElementById('live-speech-transcription-box');
    if (box) {
      box.classList.toggle('transcription-hidden', !this.transcriptionActive);
    }
    const btn = document.getElementById('btn-toggle-transcript');
    if (btn) {
      btn.innerHTML = this.transcriptionActive ? '📝 Transcript: ON' : '📝 Transcript: OFF';
      btn.classList.toggle('active', this.transcriptionActive);
    }
    return this.transcriptionActive;
  }

  // # Function: Update Subtitle DOM & Live Speech Transcription Feed
  updateSubtitleDOM(text, category) {
    const subtitleEl = document.getElementById('voice-subtitle-text');
    const badgeEl = document.getElementById('voice-category-badge');
    if (subtitleEl) subtitleEl.textContent = text;
    if (badgeEl) {
      badgeEl.textContent = category.toUpperCase();
      badgeEl.className = `voice-cat-badge cat-${category.toLowerCase()}`;
    }

    const liveText = document.getElementById('live-transcription-text');
    if (liveText) {
      liveText.innerHTML = `<strong>[${category.toUpperCase()}]</strong> "${text}"`;
    }
  }

  // # Function: Animate waveform bars
  setWaveActive(active) {
    const waveContainer = document.getElementById('voice-wave-container');
    if (waveContainer) {
      waveContainer.classList.toggle('wave-speaking', active);
    }
  }

  // # Function: Situational Voice Guidance Triggered in Physics Update (Part 5)
  update(physics) {
    // 1. Initial State: Hook empty & entering cockpit
    if (!physics.hasLoad && physics.crewState === 'IDLE') {
      const inPickup = physics.isHookInPickupPosition();
      if (inPickup) {
        this.speak("Hook is aligned over the ground payload. Keep controls neutral and click Call Ground Slinger to hook the load.", 'pickup_ready', 8);
      } else if (!this.welcomeTriggered) {
        this.welcomeTriggered = true;
        this.speak("Welcome to CraneLab. Your hook is empty. Use the Left Joystick for Trolley and Slew, and push the Right Joystick up to lower your hook to the ground pickup bay.", 'welcome', 60);
      }
    }

    // 2. Rigging In Progress
    if (physics.crewState === 'GROUND_RIGGING') {
      this.speak("Ground slinger is attaching four-leg wire slings to payload lifting lugs. Keep crane controls neutral!", 'rigging', 10);
    } else if (physics.crewState === 'ROOF_UNRIGGING') {
      this.speak("Building apex slinger is unhooking the slings on the roof deck. Keep crane controls neutral!", 'unrigging', 10);
    }

    // 3. Safety Breach (-15% Penalty)
    if (physics.crewSafetyBreach) {
      this.speak("Warning! Control movement detected while slinger in active rigging zone! Safety score penalized by 15 percent!", 'breach', 8, true);
    }

    // 4. Excessive Pendulum Sway Alert (> 6 deg)
    const swayMag = Math.hypot(physics.pendulumRadialDeg, physics.pendulumTangentialDeg);
    if (swayMag > 6.0) {
      this.speak("Warning! Load swing is high. Feather the Left Joystick gently to dampen the pendulum.", 'sway_warning', 8);
    }

    // 5. Approaching Target Zone with Payload at Building Apex (24m)
    if (physics.hasLoad && physics.crewState === 'IDLE') {
      const inApexDrop = physics.isHookInDropPosition();
      if (inApexDrop) {
        this.speak("Load is steady over the building apex. Click Call Building Apex Slinger to release the payload onto the roof.", 'target_ready', 8);
      }
    }
  }
}

// # State Block: Instantiate Singleton Global Physics Engine Instance & Export Configuration
if (typeof window !== 'undefined') {
  window.CRANE_PHYSICS_CONFIG = CRANE_PHYSICS_CONFIG;
  window.CranePhysics = new CranePhysicsEngine();
  window.CraneVoiceInstructor = new CraneVoiceInstructor();
}
