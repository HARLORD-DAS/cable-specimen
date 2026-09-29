# Automated Cable Specimen Preparation System — 3D Engineering Digital Twin

[![Three.js](https://img.shields.io/badge/Three.js-r170-black.svg?style=flat&logo=three.js)](https://threejs.org/)
[![Vite](https://img.shields.io/badge/Vite-6.0-646CFF.svg?style=flat&logo=vite)](https://vitejs.dev/)
[![Standards](https://img.shields.io/badge/Standards-IS%2010810%20%7C%20IS%207098-amber.svg?style=flat)](https://bis.gov.in/)
[![License](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

An interactive, high-fidelity 3D engineering digital twin of the **Universal Automated Cable Specimen Preparation and Routing System**. Engineered to simulate mechanical kinematics, precision cable stripping, specimen punch-and-die operations, and automated quality metrology adhering to **IS 10810** and **IS 7098** industrial testing standards.

---

## 🏭 System Architecture Overview

The digital twin models the complete physical process line with 1:1 mechanical fidelity:

```
[ CABLE SUPPLY REEL ] (X = -2.7 m)
         │
         ▼
[ UNIVERSAL INLET & GUIDE ROLLERS ]
         │
         ▼
[ 7-ROLLER DUAL-PLANE STRAIGHTENER & SERVO FEED ]
         │
         ▼
[ DUAL-AXIS OPTICAL LASER MICROMETER ] (4 sensors @ 90°)
         │
         ▼
[ ADAPTIVE V-JAW CLAMPING CARRIAGE ]
         │
         ▼
[ PRECISION ROTARY CUTTER & LONGITUDINAL SLITTER ]
         │
         ▼
[ ARTICULATED PEELING FINGERS & SEPARATION WEDGE ]
         │
         ▼
[ POLYMER DUMBBELL PUNCH PRESS ] ───► [ CART 2: DUMBBELL SPECIMENS (IS 10810 Pt 7) ]
         │
         ▼
[ CONDUCTOR WIRE STRAIGHTENER & SHEAR ] ──► [ CART 1: CONDUCTOR SPECIMENS (IS 10810 Pt 2) ]
         │
         ▼
[ TELECENTRIC VISION METROLOGY SYSTEM ] ──► [ CART 4: REJECT BIN ]
         │
         ▼
[ 2-AXIS SERVO TRANSFER & DIVERTER ] ────► [ CART 3: INSULATION SHEETS (IS 10810 Pt 33) ]
```

---

## 🌟 Key Features

### 1. Mechanical Kinematics & Physical Feedback
- **Cable Supply Reel:** Large $820\text{ mm}$ OD rotating payout reel with physical unspooling, dynamic sag curve, tension brake, and rotary encoder feedback.
- **Feed & Straightener:** Precision servo drive, helical coupling, drive shaft with pillow block bearings, and alternating 7-roller straightening bed.
- **Rotary & Longitudinal Cutting:** Dual-ring orbital blade with micrometer radial infeed ($0.2\text{ mm}$ to $6.0\text{ mm}$) and axial slitter with auto-retract.
- **Punch Press & Conductor Shear:** 10 kN hydraulic C-frame dumbbell stamping press and calibrated wire shear.
- **4 Mobile Collection Carts:** Color-coded collection carts docked along the front lower chassis (Conductor, Dumbbell, Sheets, Reject) that physically accumulate specimens in real time.

### 2. Standards Compliance & Cable Models
- **IS 10810 Part 7:** Tensile strength and elongation at break (Die-cut dumbbell specimens).
- **IS 10810 Part 2:** Conductor electrical resistance and tensile wire specimens.
- **IS 10810 Part 33:** Insulation thickness and radial concentricity slices.
- **IS 7098 (Parts 1 & 2):** XLPE insulated power and distribution cables.
- **Cable Architectures Supported:**
  - **Multi-Core Power Cable (Ref 1):** 4-core sector/circular copper/aluminium conductors, XLPE phase & neutral insulation, fibrous interstitial filler compound, and black outer PE/PVC protective sheath.
  - **Shielded Control Cable (Ref 2):** Basket-weave wire braid armor, flame-retardant inner jacket, Al-foil tape shield with drain wire, and twisted triad cores.

### 3. Engineering Inspection & View Modes
- **NORMAL:** Full industrial assembly with dark industrial graphite (`#2B2E31`) and structural framing (`#555A5E`).
- **TRANSPARENT:** Highly transparent polycarbonate enclosure panels with visible edge geometry, exposing internal kinematics during operation.
- **CROSS-SECTION:** Interactive stepped cutaway modal with canvas 2D multi-layer diagrams, dimensional callouts, and material layer callouts.
- **EXPLODE:** Smooth parametric disassembly separating all mechanisms along their functional kinematic axes.
- **ASSEMBLE:** Seamless reassembly returning all components to their docked operational coordinates.

### 4. Human-Machine Interface (HMI)
- **Three Operational Modes:**
  - `AUTO`: Fully autonomous 18-step preparation sequence.
  - `MANUAL`: Real-time parameter sliders (outer diameter, feed speed, roller gap, cut depth) that directly update the 3D model.
  - `AUTO OVERRIDE`: Autonomous execution with runtime recipe parameter adjustments.
- **Telemetry Display:** Real-time cycle time, feed encoder displacement, laser micrometer diameter, cutting force, and safety door interlock state.
- **Fixed-Camera Inspection:** Clicking any mechanism or cart highlights the object with an amber indicator ring and opens contextual details **without unwanted camera jumps or auto-zooms**.

---

## ⌨️ Keyboard Shortcuts

| Key | Action |
| :---: | :--- |
| `Space` | Start / Pause Automated Kinematic Cycle |
| `E` | Toggle Exploded View / Assembled View |
| `T` | Toggle Transparent Safety Enclosure |
| `C` | Open Cable Cross-Section & Layer Modal |
| `R` | Reset Camera to 3/4 Front Engineering Overview |

---

## 🚀 Quick Start

### Prerequisites
- [Node.js](https://nodejs.org/) (v18.0 or higher recommended)
- [npm](https://www.npmjs.com/) (v9.0 or higher)

### Installation
```bash
# Clone the repository
git clone https://github.com/HARLORD-DAS/cable-specimen.git
cd cable-specimen

# Install dependencies
npm install
```

### Running Locally (Development Server)
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

### Building for Production
```bash
npm run build
```
The compiled, optimized static assets will be output to the `dist/` directory.

### Preview Production Build
```bash
npm run preview
```

### Automated Runtime Test
```bash
node scripts/test_runtime.js
```
Executes an automated headless Chrome CDP session verifying WebGL canvas initialization, 3D interaction, view modes, and error-free operation.

---

## 📁 Repository Structure

```
cable-specimen/
├── index.html                  # Main application entry point HTML
├── package.json                # Project dependencies and npm scripts
├── vite.config.js              # Vite configuration (relative base, server)
├── scripts/
│   └── test_runtime.js         # Automated headless Chrome CDP test runner
└── src/
    ├── main.js                 # Application orchestrator, raycasting, render loop
    ├── styles.css              # Industrial engineering design system styles
    ├── environment/
    │   └── StudioEnvironment.js# Dark industrial workspace (#111315), 3-point lighting
    ├── models/
    │   ├── Cable3DModel.js     # Multi-layer parametric physical cable model
    │   ├── CableReelSystem.js  # Payout reel, A-frame stand, and unspooling mechanics
    │   ├── ClampingSystem.js   # Adaptive V-jaw clamping mechanism
    │   ├── ConductorStation.js # Conductor wire straightener & shear station
    │   ├── CuttingSystem.js    # Rotary circumferential cutter & longitudinal slitter
    │   ├── DumbbellStation.js  # 10 kN hydraulic dumbbell die punch press
    │   ├── EnclosureSystem.js  # Polycarbonate safety enclosure & door interlock
    │   ├── FeedStraightenerSystem.js # 7-roller straightener bed & servo feed drive
    │   ├── InletSystem.js      # Universal 4-roller self-centering inlet guide
    │   ├── LaserMeasurementSystem.js # Dual-axis optical laser micrometer frame
    │   ├── MachineFrame.js     # Heavy industrial base chassis & signal tower
    │   ├── OutputTraysSystem.js# 4 mobile collection carts with specimen accumulation
    │   ├── PLCCabinet.js       # S7-1500 cabinet, safety relays, pivoting HMI
    │   ├── RoutingSystem.js    # 2-axis servo transfer shuttle & diverter gate
    │   ├── StrippingSystem.js  # Articulated peeling fingers & core wedge
    │   └── VisionInspectionSystem.js # Telecentric camera & ring illuminator
    ├── simulation/
    │   ├── KinematicsMath.js   # Mathematical kinematics & interpolation
    │   ├── RecipeManager.js    # Standard recipe definitions & parameter limits
    │   └── SimulationEngine.js # 18-step state machine orchestrator
    ├── ui/
    │   ├── CrossSectionModal.js# Interactive cable cross-section modal
    │   └── HMIOverlay.js       # Top bar, docked panels, bottom machine controls
    └── utils/
        ├── AudioSynthesizer.js # Web Audio API procedural sound synthesizer
        └── CameraController.js # Orbit controls with 3/4 front view and ground bounds
```

---

## 📜 Standards Reference
- **IS 10810 (Part 7):** Methods of test for cables — Tensile strength and elongation at break of thermoplastic and elastomeric insulation and sheath.
- **IS 10810 (Part 2):** Tensile test and elongation at break on conductor wires.
- **IS 10810 (Part 33):** Measurement of thickness of insulation and sheath.
- **IS 7098 (Part 1 & 2):** Cross-linked polyethylene insulated PVC sheathed cables.

---

## 📄 License
This project is licensed under the MIT License.
