# 🚨 CrisisOS

### AI-Powered Disaster Response, Triage & Resource Allocation Platform

[![Next.js](https://img.shields.io/badge/Next.js-16.3.4-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)
[![Google Gemini](https://img.shields.io/badge/Google_Gemini-Vision_%26_Flash-4285F4?style=for-the-badge&logo=google)](https://ai.google.dev/)
[![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL_%26_pgvector-3ECF8E?style=for-the-badge&logo=supabase)](https://supabase.com/)
[![Live Demo](https://img.shields.io/badge/Live_Demo-Vercel-000000?style=for-the-badge&logo=vercel)](https://crisisos-three.vercel.app/)

> 🌐 **Live Production Deployment**: [https://crisisos-three.vercel.app/](https://crisisos-three.vercel.app/)

**CrisisOS** is an intelligent disaster command and response platform engineered to answer the single most urgent question in crisis operations:

> **“Where should rescue teams go first, and why?”**

During natural catastrophes, emergency command centers face fragmented reports, rapid environmental degradation, and extreme resource constraints. CrisisOS unifies **deterministic risk modeling, geospatial tactical radar, Gemini Vision aerial reconnaissance, vector-grounded emergency guidelines (RAG), and intelligent resource allocation** into a unified, mission-critical operational cockpit.

---

## 🎯 The Emergency Problem

During rapid-onset disasters (such as catastrophic flooding, hurricanes, or urban collapse), incident commanders must rapidly decide:

- **Which sectors face the highest mortality risk?**
- **Where are medical interventions critically overdue?**
- **Which arterial roads, bridges, and access corridors remain passable?**
- **How should finite rescue boats, ambulances, and water purification units be dispatched?**
- **How can decisions be grounded in verified doctrine rather than LLM hallucinations?**

Traditional command chains rely on fragmented phone logs, manual spreadsheets, and ungrounded guesswork. CrisisOS replaces delay with verified, deterministic clarity.

---

## 💡 The CrisisOS Solution Architecture

```
┌────────────────────────────────────────────────────────────────────────┐
│                        CRISISOS COMMAND COCKPIT                        │
│            (Next.js 16 • Turbopack • Tactical Dark Mode HUD)            │
└───────┬───────────────────┬───────────────────┬─────────────────┬──────┘
        │                   │                   │                 │
┌───────▼────────┐  ┌───────▼────────┐  ┌───────▼───────┐ ┌───────▼──────┐
│  GEOSPATIAL    │  │ DETERMINISTIC  │  │ GEMINI VISION │ │  VECTOR RAG  │
│  RADAR & MAP   │  │  RISK ENGINE   │  │ RECONNAISSANCE│ │  GUIDELINES  │
│  Leaflet / HUD │  │ 5-Factor Score │  │ Structural &  │ │   Supabase   │
│  Sector Bounds │  │ Priority Rank  │  │ Hazard Triage │ │   pgvector   │
└───────┬────────┘  └───────┬────────┘  └───────┬───────┘ └───────┬──────┘
        │                   │                   │                 │
        └───────────────────┴─────────┬─────────┴─────────────────┘
                                      │
                         ┌────────────▼────────────┐
                         │   OPERATIONAL DISPATCH  │
                         │    & ALLOCATION ENGINE  │
                         │ Boats • Teams • Medics  │
                         └────────────┬────────────┘
                                      │
                         ┌────────────▼────────────┐
                         │   TAMPER-EVIDENT AUDIT  │
                         │    & PERSISTENCE DB     │
                         │   Supabase PostgreSQL  │
                         └─────────────────────────┘
```

---

## 🧠 Core Capabilities

### 1. 🗺️ Tactical Geospatial Radar & Zone Mapping
- Live visualization of affected emergency sectors (e.g., Delta Basin, River Bend, Industrial Park).
- Immediate visual indicators for water line surge, road blockages, and casualty concentrations.
- Seamless dual-mode: Real-time satellite telemetry with instant deterministic fallback.

### 2. ⚠️ Deterministic 5-Factor Risk Engine
CrisisOS enforces **strict AI governance**: AI models are never permitted to guess or hallucinate life-or-death priority scores.
- **Formula:**
  $$\text{Risk Score} = 0.30 \times \text{Pop} + 0.25 \times \text{Sev} + 0.20 \times \text{Med} + 0.15 \times \text{Acc} + 0.10 \times \text{Inf}$$
- Strictly mathematical, deterministic priority ranking ($1$ to $N$).
- Guaranteed transparency for incident commanders and auditors.

### 3. 👁️ Optical Reconnaissance with Gemini Vision
- Upload drone, satellite, or ground reconnaissance imagery (JPEG, PNG, WEBP).
- Gemini Vision multimodal models extract:
  - Acute hazards (electrical lines in water, submerged obstacles, hazardous materials)
  - Infrastructure destruction (span deck collapses, wall failures)
  - Road impassability status
  - Survivor visual evidence and rooftop clustering
- Bounded retry resilience and automated fallback across Gemini flash models.
- **Strict Persistence Contract**: Reports `persisted: true` only when rows are validated by Supabase PostgreSQL; otherwise uses temporary in-memory server cache clearly marked for the operator.

### 4. 📚 Vector RAG Emergency Guidelines
- Grounded in official disaster protocols (FEMA, UN OCHA, WHO, Red Cross).
- Embedded via `text-embedding-004` into Supabase `pgvector`.
- Semantic vector similarity retrieves exact tactical guidelines for active hazards (e.g., swift-water rescue protocols, hypothermia management).

### 5. 🤖 AI-Assisted Operational Response Planning
- Synthesizes live zone risk data, visual reconnaissance evidence, and retrieved guidelines.
- Generates structured, time-phased tactical intervention plans.
- Eliminates cognitive overload during high-stress dispatch operations.

### 6. 🚑 Mathematical Resource Allocation Matrix
- Dynamic allocation of finite disaster assets:
  - **Swift-Water Rescue Teams**
  - **Shallow-Draft Jetboats & Airboats**
  - **Advanced Life Support (ALS) Ambulances**
  - **Emergency Medical Units**
  - **High-Capacity Water Purification Units**
- Assets are weighted against priority ranks to guarantee aid reaches critical survival zones first.

### 7. 🛡️ Tamper-Evident Audit Trail
- Every incident triage, image reconnaissance, and dispatch decision is logged.
- Full traceability for post-disaster review, governmental inquiry, and FEMA compliance.

---

## 🛠️ Technology Stack

| Layer | Technology | Purpose |
| :--- | :--- | :--- |
| **Framework** | [Next.js 16.3.4](https://nextjs.org/) (App Router, Turbopack) | High-performance server-rendered command portal |
| **Language** | [TypeScript 5](https://www.typescriptlang.org/) | End-to-end type safety and validated schema boundaries |
| **Styling** | [TailwindCSS](https://tailwindcss.com/) & Vanilla CSS Tokens | Ultra-fast, military-grade dark HUD aesthetics |
| **AI Vision** | [Google Gemini 2.5 Flash](https://ai.google.dev/) | Multimodal image triage, damage identification |
| **AI Embeddings** | Google `text-embedding-004` | 768-dimensional semantic guideline vectorization |
| **Database** | [Supabase PostgreSQL](https://supabase.com/) | Relational database with Row Level Security (RLS) |
| **Vector Engine**| Supabase `pgvector` | HNSW cosine similarity search for emergency doctrine |
| **Icons** | [Lucide React](https://lucide.dev/) | Clean, accessible tactical iconography |
| **Deployment** | [Vercel](https://vercel.com/) | Global serverless edge deployment with automated CI/CD |

---

## 🚀 Quickstart & Local Setup

### Prerequisites
- **Node.js**: v18.18.0 or later (v20+ recommended)
- **npm** or **yarn** or **pnpm**
- A **Google Gemini API Key** ([Get one here](https://aistudio.google.com/))
- A **Supabase Project** ([Create one here](https://supabase.com/))

### 1. Clone the Repository
```bash
git clone https://github.com/zafran-coder/crisisos-.git
cd crisisos-
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Configure Environment Variables
Create a `.env.local` file in the project root:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key

# Optional: Privileged server-side key for bypassing RLS during batch imports
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Google Gemini API Key
GEMINI_API_KEY=your-gemini-api-key
```

### 4. Database Setup (Supabase)
Run the SQL setup scripts in your **Supabase SQL Editor**:
1. [`supabase/seed.sql`](supabase/seed.sql) — Initializes active incidents, affected zones, and initial risk metrics.
2. [`supabase/vision_persistence.sql`](supabase/vision_persistence.sql) — Creates `disaster_images` & `vision_analysis` tables with scoped RLS policies.
3. [`supabase/rpc_response_plan.sql`](supabase/rpc_response_plan.sql) — Deploys the atomic response plan creation RPC.

### 5. Run Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser to access the CrisisOS dashboard.

### 6. Lint and Build Verification
```bash
# Run strict TypeScript ESLint
npm run lint

# Compile production Next.js bundle
npm run build
```

---

## 📡 API Reference

| Method | Route | Description |
| :--- | :--- | :--- |
| `GET` | `/api/zones` | Returns all active disaster sectors with deterministic risk metrics |
| `POST` | `/api/vision` | Accepts image upload; executes Gemini Vision triage & persists evidence |
| `GET` | `/api/vision?zoneCode=F-03` | Retrieves persisted visual assessment for an emergency sector |
| `POST` | `/api/rag` | Performs vector cosine similarity search against emergency guidelines |
| `POST` | `/api/response-plan` | Generates and commits an actionable multi-zone response plan |
| `GET` | `/api/allocations` | Returns current asset distribution matrix across emergency sectors |
| `POST` | `/api/audit` | Appends verified operational events to the audit trail |

---

## 👥 Team & Credits

### 👑 Core Leadership & Engineering

| Role | Name | GitHub | Contribution |
| :--- | :--- | :--- | :--- |
| **Core Developer & Lead Engineer** | **Zafran** | [@zafran-coder](https://github.com/zafran-coder) | Full system architecture, end-to-end codebase implementation, deterministic 5-factor risk engine, Gemini Vision reconnaissance pipeline, Supabase vector RAG, and production deployment. |

### 🤝 Contributors & Supporting Roles

| Name | GitHub | Role & Responsibilities |
| :--- | :--- | :--- |
| **Aima Muzammil** | [@AimaMuzammil](https://github.com/AimaMuzammil) | Project Ideation & Lead |
| **Iman Hameed** | [@imanhameed167-collab](https://github.com/imanhameed167-collab) | QA Testing & Presenter |
| **Samia Akram** | [@SamiaAkram-74](https://github.com/SamiaAkram-74) | Documentation & Slides |
| **Syeda Sahara Murtaza** | [@Syeda-Sahara-Murtaza](https://github.com/Syeda-Sahara-Murtaza) | PRD & Presenter  |
| **Tayyab Irshad** | [@Tayyab-Irshad](https://github.com/Tayyab-Irshad) | Research & Data Gathering |

---

## 📄 License

This project is licensed under the **MIT License**. Built for humanitarian disaster triage and emergency decision support.
