GridCharge — Smart EV Fleet Charging & Peak-Demand Management

GridCharge is an enterprise-style web application for managing electric vehicle fleet charging at high-throughput commercial depots.

The platform is designed around a practical operator workflow:

Vehicle dispatch schedule PDF → extraction → validation/review → scenario approval → baseline charging schedule → smart optimization → operational analysis

The frontend is built with React and TypeScript and is designed to connect to a Spring Boot/Java smart-charging optimization backend.

Project Overview

Commercial EV depots may need to charge many vehicles while satisfying:

vehicle departure deadlines
minimum required state of charge
charger power limits
site electrical capacity
peak-demand constraints
electricity tariff periods
vehicle charging requirements
fleet priorities

GridCharge provides an operations interface for turning a dispatch schedule into a charging scenario and then sending that scenario to a charging optimization engine.

The application is designed for:

commercial delivery fleets
logistics depots
postal distribution centers
fleet operators
high-throughput EV charging facilities
Core Workflow
                    ┌─────────────────────┐
                    │ Vehicle Schedule PDF│
                    └──────────┬──────────┘
                               │
                               ▼
                    ┌─────────────────────┐
                    │ PDF Text Extraction │
                    └──────────┬──────────┘
                               │
                               ▼
                    ┌─────────────────────┐
                    │ Schedule Normalizer │
                    └──────────┬──────────┘
                               │
                               ▼
                    ┌─────────────────────┐
                    │ Validation / Review │
                    └──────────┬──────────┘
                               │
                         Operator Approval
                               │
                               ▼
                    ┌─────────────────────┐
                    │ Active Fleet       │
                    │ Charging Scenario   │
                    └──────────┬──────────┘
                               │
                               ▼
                    ┌─────────────────────┐
                    │ Baseline Scheduler │
                    └──────────┬──────────┘
                               │
                               ▼
                    ┌─────────────────────┐
                    │ Java Optimization  │
                    │ Engine             │
                    └──────────┬──────────┘
                               │
                               ▼
                    ┌─────────────────────┐
                    │ Optimized Schedule  │
                    └──────────┬──────────┘
                               │
                               ▼
              ┌────────────────────────────────┐
              │ Dashboard / Schedule / Energy │
              │ / Analytics / Operations      │
              └────────────────────────────────┘
Features
1. Vehicle Schedule PDF Import

Operators can upload an existing dispatch schedule PDF instead of manually entering every vehicle.

The PDF is processed locally in the browser using pdfjs-dist.

The application extracts vehicle records containing:

Field	Description
Vehicle ID	Unique fleet vehicle identifier
Model	Vehicle model
Route	Assigned delivery route
Priority	Charging priority
Arrival	Depot arrival time
Departure	Required departure time
Current SOC	Current battery state of charge
Target SOC	Required SOC
Battery Capacity	Battery capacity in kWh
Required Energy	Energy required for the vehicle
Max Charging Power	Maximum charging power

Example:

EV-1001 | Mercedes eSprinter | North Loop | HIGH | 04:30 | 06:30 | 38% | 85% | 60 kWh | 31 kWh | 22 kW

The importer is designed to tolerate PDF text extraction differences such as:

line breaks
separate PDF text items
whitespace variations
multiple pages
header/footer content
2. Extraction Review

After extraction, the operator can review the imported vehicle records before activating them.

The review interface displays:

extraction status
number of vehicles extracted
valid vehicles
warnings
errors
duplicate vehicle IDs
individual vehicle records

The operator can review or edit extracted values before approval.

The system should never silently turn malformed or incomplete records into valid data.

3. Scenario Validation

Imported vehicles are validated before entering the active charging scenario.

Validation includes checks such as:

Vehicle ID
    ↓
Required fields
    ↓
Time format
    ↓
SOC range
    ↓
Battery capacity
    ↓
Required energy
    ↓
Charging power
    ↓
Priority
    ↓
Duplicate ID detection

Typical normalized values are represented semantically:

currentSoc = 38
targetSoc = 85
batteryCapacity = 60
requiredEnergy = 31
maxChargingPower = 22

rather than keeping PDF formatting such as %, kWh, and kW.

4. Fleet Management

The Fleet Management page provides an operational view of the active vehicle fleet.

It is intended to show:

vehicle identity
model
route
charging requirements
SOC
charging status
scheduling information
priority

Imported vehicles become part of the active scenario after operator approval.

5. Charging Infrastructure

The application provides an infrastructure view for depot charging resources.

The interface is intended to represent:

charging stations
charger power
infrastructure availability
charging capacity
infrastructure utilization

Infrastructure configuration is used as part of the charging scenario and optimization process.

6. Charging Schedule

The Charging Schedule page is the central operational view for charging activity.

Before optimization, the application can display a calculated Baseline Schedule.

After a successful optimizer response, the schedule switches to the actual optimized result.

The important distinction is:

NO OPTIMIZATION
      ↓
Baseline Schedule

REAL OPTIMIZER RESPONSE
      ↓
Optimized Schedule

The application does not intentionally fabricate optimization results when the backend has not run.

7. Smart Optimization

The frontend is designed to communicate with an external Spring Boot/Java optimization engine.

Default development endpoint:

http://localhost:8081

The optimization endpoint is:

POST /api/v1/OptimizeChargingProfiles

The intended architecture is:

React Frontend
      │
      │ HTTP
      ▼
Spring Boot REST API
      │
      ▼
Java Smart Charging Optimizer

The optimizer is responsible for generating the actual charging result from the approved scenario.

The frontend validates the returned response before displaying it.

8. Optimization State Management

GridCharge uses explicit optimization states rather than assuming an optimization result exists.

Conceptually:

NOT_RUN
   │
   ▼
RUNNING
   │
   ├─────────────► SUCCESS
   │
   ├─────────────► FAILED
   │
   └─────────────► UNAVAILABLE

This prevents old, cached, or fabricated results from being presented as current optimization output.

9. Dashboard

The Dashboard is the primary operations overview.

It is intended to surface:

fleet status
charging activity
site capacity
optimization status
peak-demand information
operational alerts
charging schedule state

The Dashboard uses the shared scenario state rather than maintaining an independent copy of optimization results.

10. Energy & Grid

The Energy & Grid page provides the depot electrical context.

It is designed around:

site power capacity
charging demand
peak periods
energy usage
tariff periods
charging load
grid constraints

These values form part of the optimization context.

11. Simulation

The Simulation page is intended for operational what-if analysis.

It can be used to examine how changing scenario inputs can affect charging behavior and depot load.

Example scenario parameters may include:

Number of vehicles
Charger availability
Site capacity
Charging demand
Tariff periods

Simulation functionality is separate from the real production optimizer workflow unless explicitly connected to the optimization engine.

12. Analytics

The Analytics page provides a higher-level operational view of fleet charging activity.

Potential operational metrics include:

charging utilization
energy usage
peak demand
charging efficiency
fleet charging behavior
schedule performance

The long-term architecture is to derive these values from actual scenario and optimization results rather than static demo fixtures.

13. Settings

The Settings page provides application-level configuration and system information.

The frontend supports centralized API configuration through:

VITE_API_BASE_URL

Default:

http://localhost:8081
Technology Stack
Frontend
React 19
TypeScript
Vite
Tailwind CSS
Tailwind Vite plugin
Lucide React
Motion
pdfjs-dist
Backend Integration
Spring Boot
Java
REST API
Existing Java smart charging optimization engine
Development
Node.js
npm
TypeScript
Vite development server
Project Structure

A simplified project structure:

ev_managment/
│
├── src/
│   ├── components/
│   │   ├── Dashboard.tsx
│   │   ├── FleetManagement.tsx
│   │   ├── ChargingInfrastructure.tsx
│   │   ├── ChargingSchedule.tsx
│   │   ├── EnergyAndGrid.tsx
│   │   ├── Simulation.tsx
│   │   ├── Analytics.tsx
│   │   ├── Settings.tsx
│   │   ├── OptimizationResult.tsx
│   │   ├── PdfScheduleImport.tsx
│   │   ├── PdfScheduleWorkflow.tsx
│   │   ├── ExtractionReview.tsx
│   │   ├── ScenarioValidationPanel.tsx
│   │   └── ...
│   │
│   ├── context/
│   │   └── GridChargeContext.tsx
│   │
│   ├── services/
│   │   ├── optimizationService.ts
│   │   ├── optimizerContract.ts
│   │   ├── baselineService.ts
│   │   ├── pdfExtractionService.ts
│   │   └── scenarioValidationService.ts
│   │
│   ├── types/
│   │   └── scenario.ts
│   │
│   ├── data/
│   │   └── initialData.ts
│   │
│   ├── App.tsx
│   ├── types.ts
│   └── ...
│
├── .env.example
├── index.html
├── metadata.json
├── package.json
├── package-lock.json
├── tsconfig.json
├── vite.config.ts
└── README.md
Important Services
pdfExtractionService.ts

Responsible for:

PDF
 ↓
pdfjs-dist
 ↓
page text
 ↓
row detection
 ↓
field extraction
 ↓
vehicle normalization

The importer processes the PDF locally in the browser.

scenarioValidationService.ts

Responsible for checking that normalized vehicles form a valid scenario.

Example:

currentSoc: 38
targetSoc: 85
batteryCapacity: 60
requiredEnergy: 31
maxChargingPower: 22
baselineService.ts

Responsible for creating the pre-optimization charging schedule.

This is a baseline scheduling mechanism rather than the final smart optimization engine.

Its purpose is to provide an actual schedule derived from scenario inputs before the Java optimizer runs.

optimizationService.ts

Responsible for communicating with the backend optimizer.

Expected flow:

Approved Scenario
      ↓
Build API Request
      ↓
POST /api/v1/OptimizeChargingProfiles
      ↓
Receive Response
      ↓
Validate Response
      ↓
Store Optimization Result
optimizerContract.ts

Provides frontend-side validation of the optimizer response.

The purpose is to prevent malformed backend responses from being treated as valid optimization results.

Shared State

GridChargeContext.tsx acts as the central state layer for the application.

The architecture is intended to keep the active scenario and optimization result synchronized across:

Dashboard
Fleet Management
Charging Schedule
Energy & Grid
Optimization Result
validation/import workflow

The objective is to avoid each page maintaining its own independent version of the scenario.

Environment Variables

Create a local .env file when needed.

Example:

VITE_API_BASE_URL=http://localhost:8081

The default frontend API URL is:

http://localhost:8081

The repository also contains an example environment file with AI Studio-related environment variables.

Running the Frontend

Clone the repository:

git clone https://github.com/rahul-sketch7/ev_managment.git
cd ev_managment

Install dependencies:

npm install --legacy-peer-deps

Run the development server:

npm run dev

The Vite configuration runs the application on:

http://localhost:3000
Backend

GridCharge is designed to connect to the separate Java smart charging backend.

Expected backend location during development:

http://localhost:8081

Expected endpoint:

POST /api/v1/OptimizeChargingProfiles

The Java backend must be running before executing the real optimization workflow.

End-to-End Demo

A typical demonstration follows these steps.

Step 1 — Start the Java optimizer

Start the Spring Boot backend and verify:

http://localhost:8081

is available.

Step 2 — Start GridCharge
npm run dev

Open:

http://localhost:3000
Step 3 — Import dispatch schedule

Open:

Dashboard
→ Import Vehicle Schedule

Upload the vehicle schedule PDF.

Step 4 — Extract

Click:

Extract Schedule

The browser extracts and normalizes the vehicle records.

Step 5 — Review

Review:

vehicle IDs
models
routes
priorities
arrival times
departure times
SOC
battery capacity
required energy
maximum charging power
Step 6 — Validate

The schedule must pass validation.

For a clean demo dataset:

Vehicles extracted: 27
Valid vehicles: 27
Errors: 0
Duplicate IDs: 0
Step 7 — Approve

Click:

Approve Schedule

The imported vehicles become the active scenario.

Step 8 — Baseline

GridCharge calculates the actual baseline schedule from the imported scenario and infrastructure inputs.

Step 9 — Smart Optimization

Click:

Run Smart Optimization

The frontend sends the approved scenario to the Java optimizer.

Step 10 — Review result

The resulting optimization data is shown across:

Dashboard
Charging Schedule
Energy & Grid
Optimization Result
Analytics
Demo PDF

A demo schedule can contain rows such as:

EV-1001 | Mercedes eSprinter | North Loop | HIGH | 04:30 | 06:30 | 38% | 85% | 60 kWh | 31 kWh | 22 kW
EV-1002 | Ford E-Transit | Airport | NORMAL | 04:45 | 06:45 | 61% | 85% | 68 kWh | 24 kWh | 19 kW
EV-1003 | Tata Ace EV | Downtown | HIGH | 05:30 | 07:00 | 32% | 80% | 45 kWh | 22 kWh | 15 kW

The PDF represents input data, not optimization output.

Optimization values should come from the actual optimization workflow.

Design System

GridCharge uses an enterprise operations/control-center visual language.

The intended design characteristics are:

light theme
dark navy text
blue primary accent
green success states
amber warnings
red critical states
subtle borders
restrained shadows
dense but readable tables
desktop-first layout
operational dashboards
clear hierarchy

The design intentionally avoids:

neon styling
cyberpunk styling
excessive gradients
purple/cyan AI effects
glowing interfaces
excessive glassmorphism
decorative elements that reduce operational clarity
Navigation

Primary navigation:

Dashboard
Fleet Management
Charging Infrastructure
Charging Schedule
Energy & Grid
Simulation
Analytics
Settings

Technical/diagnostic functionality should remain secondary rather than becoming part of the main operator workflow.

Data Integrity Principles

GridCharge follows several important data principles.

No fabricated optimization results

The application should not display a fake optimization response when the backend has not successfully returned one.

Explicit optimization state

The frontend distinguishes between:

NOT_RUN
RUNNING
SUCCESS
FAILED
UNAVAILABLE
Validate before activation

Vehicle schedule records should be validated before entering the active scenario.

Preserve source information

Imported vehicle records retain source metadata such as:

source page
source row
original extracted text
Backend result validation

The optimizer response is validated before being used by the UI.

Current Limitations

The PDF workflow currently targets selectable-text PDFs.

PDFs containing only scanned images require an OCR pipeline that is not part of the current extraction workflow.

The application also contains some demo-oriented UI/data areas that can later be migrated completely to live scenario-derived metrics.

Development Checks

Before committing changes, run:

npm run lint

and:

npm run build

A successful TypeScript check and production build should be maintained as the project evolves.

Backend Repository

The project is designed to integrate with the separate Java smart-charging implementation.

The frontend repository:

https://github.com/rahul-sketch7/ev_managment

The architecture keeps the React operator interface separate from the Java optimization engine:

                 GridCharge React
                       │
                       │ REST
                       ▼
              Spring Boot API
                       │
                       ▼
             Java Smart Charging
                 Optimization

This separation allows the operator UI and optimization engine to evolve independently.

Project Goal

The ultimate goal of GridCharge is to provide a practical operator workflow for commercial EV depots:

Existing dispatch schedule
          ↓
Automatic schedule extraction
          ↓
Data validation
          ↓
Operator approval
          ↓
Baseline charging plan
          ↓
Smart charging optimization
          ↓
Operational schedule
          ↓
Energy / grid / fleet analysis

The emphasis is on using the operator's actual schedule and infrastructure constraints as the input to the charging workflow rather than relying on manually entered or precomputed optimization results.
