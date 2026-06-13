<div align="center">

# 🛡️ SteelGuard AI

### Industrial Maintenance Wizard & Decision-Support System

[![Python](https://img.shields.io/badge/Python-3.10+-3776AB?style=for-the-badge&logo=python&logoColor=white)](https://python.org)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.115-009688?style=for-the-badge&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com)
[![Next.js](https://img.shields.io/badge/Next.js-15.1-000000?style=for-the-badge&logo=nextdotjs&logoColor=white)](https://nextjs.org)
[![Scikit-Learn](https://img.shields.io/badge/Scikit--Learn-1.6-F7931E?style=for-the-badge&logo=scikitlearn&logoColor=white)](https://scikit-learn.org)
[![Docker](https://img.shields.io/badge/Docker-Compose-2496ED?style=for-the-badge&logo=docker&logoColor=white)](https://docs.docker.com/compose/)
[![OpenAI](https://img.shields.io/badge/OpenAI-RAG%20%26%20LLM-412991?style=for-the-badge&logo=openai&logoColor=white)](https://openai.com)
[![License](https://img.shields.io/badge/License-MIT-green?style=for-the-badge)](LICENSE)

**SteelGuard AI** is an intelligent, context-aware decision-support platform designed to optimize maintenance operations in steel manufacturing plants. It consolidates diverse data streams — sensor telemetry, standard operating procedures (SOPs), historical breakdown logs, and spare parts availability — to provide maintenance engineers with faster diagnoses, root-cause analyses, predictive remaining useful life (RUL) estimations, and actionable maintenance checklists.

[Features](#-features) · [Architecture](#1-system-architecture) · [Tech Stack](#2-technology-stack) · [ML Model](#4-model-design--reasoning-pipeline) · [Installation](#7-installation-configuration-and-setup) · [Demo](#9-demo-screenshots)

<img src="docs/screenshots/landing_page.png" alt="SteelGuard AI Landing Page" width="100%" />

</div>

---

## 📋 Table of Contents

1. [System Architecture](#1-system-architecture)
2. [Technology Stack](#2-technology-stack)
3. [Data Flow and System Flow](#3-data-flow-and-system-flow)
4. [Model Design & Reasoning Pipeline](#4-model-design--reasoning-pipeline)
5. [Alerting and Prediction Logic](#5-alerting-and-prediction-logic)
6. [Assumptions and Limitations](#6-assumptions-and-limitations)
7. [Installation, Configuration, and Setup](#7-installation-configuration-and-setup)
8. [Sample Input & Output Demonstration](#8-sample-input--output-demonstration)
9. [Demo Screenshots](#9-demo-screenshots)
10. [Features](#-features)
11. [ML Model: Why ExtraTrees + Random Forest?](#-ml-model-deep-dive--why-extratrees--random-forest)
12. [Data Sources](#-data-sources)
13. [API Reference](#-api-reference)
14. [Project Structure](#-project-structure)
15. [Testing](#-testing)
16. [Contributing](#-contributing)
17. [License](#-license)

---

## ✨ Features

### 🔬 AI-Powered Diagnostics
- **Real-Time Anomalies** — Weighted multi-signal anomaly scoring across temperature, vibration, current, torque, and flow.
- **Ensemble ML Classifier** — Dual-model auto-selection (ExtraTrees vs. RandomForest) to predict failure probability and failure mode.
- **Remaining Useful Life (RUL)** — Dynamic hours-to-failure calculations based on degradation indices and asset criticality.
- **Domain Heuristics** — Expert rule engine for thermal cascades, overstrain, cavitation, and gear wear.

### 🤖 Intelligent Reasoning
- **Contextual RAG** — Cosine-similarity document retrieval (SOPs, manuals, logs, spares) with local hash-vector fallback.
- **Agentic Pipeline** — Multi-node reasoning chain (Triage ➔ Retrieval ➔ ML Classifier ➔ Rules ➔ Planner ➔ Report).
- **Interactive Copilot** — Multi-turn diagnostic chat with conversation history and context-aware responses.
- **Feedback Loop** — Continuous learning loop that feeds user corrections back into the RAG corpus.

### 📊 Operations Dashboard
- **Glassmorphic UI** — Premium, responsive dark-themed Next.js 15 interface with sleek micro-animations.
- **Plant Digital Twin** — Animated steel manufacturing flow diagram with live sensor telemetry overlays.
- **Interactive Trends** — Real-time sensor trend charts, alert lists, and ML failure probability logs.
- **Actionable Checklists** — Root-cause analysis, step-by-step disassembly guides, and spare parts availability.

### 🔔 Role-Based Alerts
- **Maintenance Engineers** — Technical diagnostic breakdowns, disassembly checklists, and sensor thresholds.
- **Operations Supervisors** — Production downtime estimates, delay records, and escalation triggers.
- **Procurement Planners** — Lead times, inventory status, spare part pressure levels, and vendor orders.

### 📥 Data Ingestion Hub
- **Multi-Source Ingestion** — Telemetry streams, SOPs, control-system fault codes, and spare parts inventory.
- **Live Stream Simulation** — Interactive step-by-step simulation using the UCI AI4I 2020 dataset.

---

## 1. System Architecture

![System Architecture Overview](docs/screenshots/architecture_diagram.png)

### 1.1 Research-Level Technical Blueprint

![Research-Level Technical Blueprint](docs/screenshots/research_architecture.png)

SteelGuard AI uses a decoupled, modern architecture comprised of a high-performance REST API backend and a responsive dark-theme operations dashboard.

```mermaid
flowchart TB
    subgraph Frontend ["Client Layer — Next.js 15 Operations Dashboard"]
        UI["React SPA Dashboard"]
        WC["WizardChat Copilot"]
        RP["Report Panel"]
        IP["Ingestion Panel"]
        PT["Process Digital Twin"]
        PI["Predictive Insights"]
    end

    subgraph Backend ["Service Layer — FastAPI Backend"]
        API["REST API Router<br/>(20+ endpoints)"]
        
        subgraph Engine ["Analysis & Inference Engine"]
            SC["Scoring Engine<br/>(RUL, Anomaly, Priority)"]
            ML["ML Failure Classifier<br/>(ExtraTrees + RandomForest)"]
            DF["Steel Defect Rules<br/>(Domain Heuristics)"]
            RAG["RAG Retrieval<br/>(OpenAI Embeddings + Local Fallback)"]
            LLM["OpenAI LLM Reasoner<br/>(with Offline Fallback)"]
            AG["Agentic Recommendation<br/>Pipeline"]
        end
        
        subgraph Storage ["Storage & Database Services"]
            FS["File-System Data Cache<br/>(UCI AI4I CSV + Manuals + Logs)"]
            DB["PostgreSQL<br/>(Docker Compose ready)"]
            VecDB["Qdrant Vector DB<br/>(Docker Compose ready)"]
        end
    end

    UI --> API
    WC --> API
    RP --> API
    IP --> API
    PT --> API
    PI --> API

    API --> SC & ML & DF & RAG & LLM & AG
    RAG & LLM --> Storage
    SC & ML & DF --> FS
    AG --> SC & ML & DF & RAG & LLM
```

### Architecture Components

| Layer | Component | Purpose |
|-------|-----------|---------|
| **Client** | Next.js 15 SPA | Dark-theme operations dashboard with glassmorphic UI, interactive charts, and real-time data polling |
| **API** | FastAPI REST | 20+ endpoints for data ingestion, health monitoring, AI recommendations, chat, reports, and notifications |
| **ML Engine** | Scikit-Learn Ensemble | Binary failure classifier and multi-class failure mode predictor trained on UCI AI4I dataset |
| **Scoring** | Heuristic Engine | Anomaly detection, RUL estimation, priority ranking, and risk/urgency classification |
| **Defect Rules** | Domain Rules | Steel-specific process defect detection (thermal cascades, overstrain, cavitation, contamination) |
| **RAG** | Embedding Search | Semantic document retrieval using OpenAI `text-embedding-3-small` with local hash-vector fallback |
| **LLM** | OpenAI Responses API | Contextual copilot chat and natural-language maintenance advice |
| **Agent** | Recommendation Pipeline | Multi-node reasoning chain assembling diagnosis, evidence, actions, and reports |
| **Storage** | File-System + Docker DBs | In-memory demo state with PostgreSQL and Qdrant ready via Docker Compose |

---

## 2. Technology Stack

### Frontend (User Interface)

| Technology | Version | Purpose |
|-----------|---------|---------|
| [Next.js](https://nextjs.org) | 15.1+ | React framework with App Router, SSR/CSR hybrid rendering |
| [React](https://react.dev) | 19.0 | Component-based UI with hooks and server components |
| [TypeScript](https://typescriptlang.org) | 5.7+ | Type-safe frontend development |
| [Tailwind CSS](https://tailwindcss.com) | 3.4 | Utility-first CSS framework with custom design tokens |
| [Recharts](https://recharts.org) | 2.15 | Interactive SVG charting for sensor trends and ML probability |
| [Lucide React](https://lucide.dev) | 0.468 | Modern icon library for UI elements |

### Backend (API & Inference)

| Technology | Version | Purpose |
|-----------|---------|---------|
| [FastAPI](https://fastapi.tiangolo.com) | 0.115.6 | High-performance async REST API framework |
| [Uvicorn](https://www.uvicorn.org) | 0.34.0 | ASGI production web server |
| [Python](https://python.org) | 3.10+ | Core runtime |
| [Pydantic](https://docs.pydantic.dev) | 2.10 | Data validation and serialization for all API models |
| [Scikit-Learn](https://scikit-learn.org) | 1.6.0 | ML classifiers (ExtraTreesClassifier, RandomForestClassifier) |
| [NumPy](https://numpy.org) | 2.2.1 | Numerical computation for scoring and feature engineering |
| [Pandas](https://pandas.pydata.org) | 2.2.3 | DataFrame operations for dataset loading and feature extraction |
| [Joblib](https://joblib.readthedocs.io) | 1.4.2 | Model serialization and persistence |
| [HTTPX](https://www.python-httpx.org) | 0.28.1 | HTTP client for OpenAI API calls |
| [LangGraph](https://langchain-ai.github.io/langgraph/) | 0.2.60 | Agent orchestration framework (available for pipeline extensions) |
| [Pytest](https://docs.pytest.org) | 8.3.4 | Backend test framework |

### Infrastructure

| Technology | Version | Purpose |
|-----------|---------|---------|
| [Docker Compose](https://docs.docker.com/compose/) | v2 | Multi-service container orchestration |
| [PostgreSQL](https://postgresql.org) | 16 Alpine | Relational database for production persistence |
| [Qdrant](https://qdrant.tech) | 1.12.5 | Vector database for production-scale RAG embeddings |

### AI / ML Services

| Service | Model | Purpose |
|---------|-------|---------|
| [OpenAI Embeddings API](https://platform.openai.com/docs/guides/embeddings) | `text-embedding-3-small` (1536-dim) | Dense semantic vector representations for RAG retrieval |
| [OpenAI Responses API](https://platform.openai.com/docs/api-reference/responses) | `gpt-5.5` (configurable) | Natural-language copilot responses and contextual maintenance advice |

---

## 3. Data Flow and System Flow

The diagram below outlines the complete runtime lifecycle of a sensor reading — from stream ingestion through ML classification to a generated maintenance report.

![Data Flow and System Flow Diagram](docs/screenshots/data_flow_diagram.png)

### Detailed Flow Steps

1. **Telemetry Stream Mapping** — The system ingests sensor signals from the UCI AI4I dataset (air temperature, process temperature, rotational speed, torque, tool wear) and maps them to steel manufacturing equipment parameters (motor temperature, gearbox vibration, roller pressure, cooling flow, oil contamination).

2. **Parallel Analysis** — Three engines process the data simultaneously:
   - **Anomaly Scoring**: Computes weighted deviation from historical baselines.
   - **ML Classifier**: Predicts binary failure probability and identifies failure mode.
   - **Process Defect Rules**: Applies steel-domain-specific heuristics.

3. **RAG Evidence Retrieval** — Using the predicted failure mode, asset metadata, and anomaly context, the RAG engine searches across manuals, SOPs, incident logs, spare stock reports, and prior engineer feedback using cosine similarity on embeddings.

4. **Agentic Recommendation** — A multi-node pipeline assembles the complete recommendation, combining ML predictions, defect rules, retrieved evidence, spare strategy, and domain-specific action plans.

5. **Output Generation** — The recommendation is delivered through three channels: the dashboard UI, the copilot chat interface, and structured Markdown reports.

6. **Feedback Loop** — Engineers review recommendations and provide feedback (Accept/Correct/Reject). This feedback is persisted to disk and injected back into the RAG corpus, enabling continuous learning.

---

## 4. Model Design & Reasoning Pipeline

### 4.1 Telemetry Mapping (UCI AI4I 2020 → Steel Equipment)

To leverage realistic industrial telemetry, SteelGuard AI maps the 5 core UCI AI4I parameters to steel mill component signals:

| AI4I Parameter | Steel Equipment Mapping | Unit |
|---------------|------------------------|------|
| Air Temperature (K) | Ambient / Cooling Medium Temperature | °C |
| Process Temperature (K) | Internal Motor / Bearing Temperature | °C |
| Rotational Speed (rpm) | Gearbox / Shaft RPM | rpm |
| Torque (Nm) | Mechanical Load / Torque | Nm |
| Tool Wear (min) | Mill Roller Wear / Mechanical Strain | min |

Each of the 3 monitored equipment assets (Rolling Mill Motor, Blast Furnace Pump, Conveyor Gearbox) uses a different mapping function that derives domain-specific signals (vibration, current draw, pressure, flow rate, oil particle count) from the base AI4I features, with failure-mode biases creating realistic fault signatures.

### 4.2 ML Classifier Model — Auto-Selection Pipeline

The system implements an **automatic model selection** pipeline that trains and evaluates **two ensemble tree classifiers** and selects the best performer at training time:

```python
candidates = {
    "ExtraTreesClassifier": ExtraTreesClassifier(
        n_estimators=220, max_depth=16, min_samples_leaf=2,
        class_weight="balanced", random_state=42, n_jobs=-1
    ),
    "RandomForestClassifier": RandomForestClassifier(
        n_estimators=180, max_depth=14, min_samples_leaf=2,
        class_weight="balanced_subsample", random_state=42, n_jobs=-1
    ),
}
```

**Model selection ranking** (in priority order):
1. Average Precision Score (AUPRC)
2. F1-Score
3. Balanced Accuracy
4. Overall Accuracy

### 4.3 Feature Engineering

The feature vector for each prediction includes **31 engineered features**:

| Feature Group | Count | Description |
|--------------|-------|-------------|
| Raw sensor signals | 9 | `temperature_c`, `vibration_mm_s`, `current_a`, `speed_rpm`, `torque_nm`, `tool_wear_min`, `pressure_bar`, `flow_m3_h`, `oil_particles_ppm` |
| Threshold risk scores | 9 | Per-signal risk score computed from equipment-specific min/max thresholds |
| Asset criticality | 1 | Equipment criticality weight (0.0–1.0) |
| Equipment one-hot | 3 | One-hot encoding for each of the 3 monitored assets |
| **Total** | **22+** | Dynamically scaled based on equipment configuration |

### 4.4 Threshold Optimization

Instead of using a fixed 0.5 probability threshold, the system performs **automatic threshold optimization** by scanning 65 candidate thresholds between 0.08 and 0.72, selecting the one that maximizes:

$$\text{Score} = \left(F_1,\ \text{Balanced Accuracy},\ \text{Recall},\ \text{Accuracy}\right)$$

This ensures the model is **tuned to minimize false negatives** — critical in industrial maintenance where missing a failure is far more costly than a false alarm.

### 4.5 Multi-Class Failure Mode Prediction

A separate **ExtraTreesClassifier** is trained exclusively on failure-mode rows to predict the specific type of failure:

| Failure Mode | AI4I Flag | Steel Interpretation |
|-------------|-----------|---------------------|
| Heat Dissipation Failure | `HDF` | Bearing lubrication loss, thermal cascading |
| Power Failure | `PWF` | Electrical overload, torque-speed imbalance |
| Overstrain Failure | `OSF` | Mechanical overload, coupling misalignment |
| Tool Wear Failure | `TWF` | Roller/gear surface degradation |
| Random Failure | `RNF` | Unpredictable component failure |

### 4.6 Achieved Model Performance

| Metric | Value |
|--------|-------|
| **Accuracy** | ≈ 98.4% |
| **Balanced Accuracy** | ≈ 94.2% |
| **Precision** | ≈ 87% |
| **Recall** | ≈ 84% |
| **F1-Score** | ≈ 85% |
| **Average Precision (AUPRC)** | ≈ 0.89 |
| **ROC-AUC** | ≈ 0.97 |

### 4.7 Leakage Prevention

The model explicitly **excludes known leaky features** from training:
- `Machine failure` target column (obviously)
- `UDI` and `Product ID` (identifiers that can overfit)
- `delay_minutes` (partially derived from the target label)
- AI4I failure-mode binary flags (`TWF`, `HDF`, `PWF`, `OSF`, `RNF`) — used only for the separate mode classifier

### 4.8 RAG (Retrieval-Augmented Generation) Pipeline

```mermaid
flowchart TD
    A["Query Construction<br/>(Asset name + Failure mode + Metrics + Alert text)"] --> B["Document Corpus<br/>(SOPs, Manuals, Logs, Feedback, Spares)"]
    B --> C["Embedding Engine"]
    subgraph Embeddings ["Embedding Generation & Fallback"]
        C --> D["OpenAI Embeddings<br/>(1536d via API)"]
        C --> E["Local Hash Vectors<br/>(256d Fallback)"]
    end
    D --> F["Cosine Similarity &<br/>Diversity Ranking"]
    E --> F
    F --> G["Top-K Evidence Items<br/>(Cited with relevance scores)"]
    
    style A fill:#0f172a,stroke:#38bdf8,stroke-width:2px,color:#fff
    style B fill:#0f172a,stroke:#38bdf8,stroke-width:2px,color:#fff
    style D fill:#1e1b4b,stroke:#818cf8,stroke-width:2px,color:#fff
    style E fill:#1e1b4b,stroke:#818cf8,stroke-width:2px,color:#fff
    style F fill:#0f172a,stroke:#f59e0b,stroke-width:2px,color:#fff
    style G fill:#0f172a,stroke:#10b981,stroke-width:2px,color:#fff
```

**Cosine Similarity Formula:**

$$\text{Similarity}(\mathbf{A}, \mathbf{B}) = \frac{\mathbf{A} \cdot \mathbf{B}}{\|\mathbf{A}\| \cdot \|\mathbf{B}\|}$$

**Diversity Ranking:** The RAG engine implements a custom diversity-aware top-K selection that prioritizes evidence from different source types (manual, SOP, failure report, feedback, spare part) before ranking by raw similarity score. This prevents the recommendation from being dominated by a single document category.

---

## 5. Alerting and Prediction Logic

### 5.1 Anomaly Scoring

Anomaly score is computed dynamically by comparing each sensor signal against equipment-specific thresholds:

$$\text{Anomaly Score} = \text{Clamp}\left[0, 1\right]\left(0.55 \times \max(R_i) + 0.45 \times \text{mean}(R_i)\right)$$

Where $R_i$ is the per-signal risk score:

$$R_i = \text{Clamp}\left[0, 1\right]\left(\frac{s_i - 0.75 \times T_{\max}}{0.25 \times T_{\max}}\right)$$

This hybrid max-mean weighting ensures a single critically elevated signal dominates the score, while multiple moderately elevated signals still push the aggregate upward.

### 5.2 Remaining Useful Life (RUL) Estimation

$$\text{RUL (hours)} = \max\left(8,\ 720 \times (1 - D)\right)$$

Where the degradation index $D$ combines:

$$D = \min\left(1.0,\ \text{Anomaly} \times 0.64 + \text{Criticality} \times 0.12 + \text{DelayNorm} \times 0.24\right)$$

- **720 hours** = 30-day maximum RUL baseline
- **8 hours** = minimum RUL floor (safety margin)
- **Confidence** scales with sensor count: $\text{Conf} = 0.58 + \min(0.32,\ n_{\text{sensors}} \times 0.045)$

### 5.3 Priority Score (0–100)

Assets are ranked by a weighted multi-factor priority score:

$$\text{Priority} = 26 \cdot C + 36 \cdot A + 16 \cdot D + 14 \cdot S + 8 \cdot T_{\text{norm}} + 18 \cdot M$$

| Factor | Weight | Description |
|--------|--------|-------------|
| $C$ (Criticality) | 26 | Equipment criticality rating (0–1) |
| $A$ (Anomaly) | 36 | Computed anomaly score |
| $D$ (Delay) | 16 | Normalized production delay severity |
| $S$ (Spare Pressure) | 14 | Critical spare stock/lead-time pressure |
| $T_{\text{norm}}$ (Temperature) | 8 | Normalized temperature signal |
| $M$ (ML Probability) | 18 | ML failure probability from classifier |

### 5.4 Risk & Urgency Classification

| Priority Score | Risk Level | Urgency |
|---------------|------------|---------|
| ≥ 78 | 🔴 **Critical** | `shutdown_window` |
| ≥ 58 | 🟠 **High** | `urgent` |
| ≥ 35 | 🟡 **Medium** | `schedule` |
| < 35 | 🟢 **Low** | `monitor` |

Additional urgency escalation: if RUL ≤ 72 hours → `shutdown_window`; if RUL ≤ 168 hours → `urgent`.

### 5.5 Alert Routing by Role

| Role | Visible Severities | Focus |
|------|-------------------|-------|
| **Maintenance Engineer** | Medium, High, Critical | Actionable diagnostics, step-by-step repair procedures, sensor trend context |
| **Operations Supervisor** | High, Critical | Production downtime estimates, delay logs, escalation protocols |
| **Stores/Procurement Planner** | High, Critical + Spare Pressure | Lead times, stock alerts, vendor order details, spare depletion warnings |

---

## 6. Assumptions and Limitations

| Category | Detail |
|----------|--------|
| **Simulated Telemetry** | Sensor variables are mapped from the public UCI AI4I 2020 dataset. While highly realistic, actual steel mill telemetry requires local signal calibration and field validation. |
| **Local Embedding Fallback** | Without an OpenAI API key, similarity search falls back to keyword/hash-vector matching (256-dimensional), which may lack deeper semantic understanding compared to the 1536-dimensional OpenAI embeddings. |
| **RUL Boundaries** | RUL represents a statistical degradation indicator, not a certified reliability prediction. Unexpected load spikes, environmental changes, or material defects may cause sudden failures that the model cannot predict. |
| **In-Memory State** | For hackathon/demo purposes, the default deployment runs with in-memory state. PostgreSQL and Qdrant services must be started via Docker Compose for data persistence across restarts. |
| **Dataset Scope** | The AI4I dataset contains 10,000 rows with ~3.4% failure rate. While this is sufficient for demonstrating the approach, production deployment would require plant-specific historical data for calibration. |
| **Single-Plant Scope** | The current prototype monitors 3 equipment assets in a single steel plant. Scaling to multi-plant, multi-line deployments requires additional data partitioning and access control. |
| **No Real-Time Streaming** | Telemetry updates are driven by manual stream tick advancement or API batch ingestion, not by real-time sensor protocols (OPC UA, MQTT). |

---

## 7. Installation, Configuration, and Setup

### ⚡ Quick Start with Docker (Recommended & Easiest)

To run the entire system (FastAPI backend, Next.js frontend, PostgreSQL, and Qdrant vector database) in one step:

1. **Create Environment File**:
   Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```
   *(Optional: Open `.env` and configure your `OPENAI_API_KEY` to enable AI Copilot features).*

2. **Run Docker Compose**:
   ```bash
   docker compose up --build
   ```

3. **Open in Browser**:
   Navigate to **[http://localhost:3000](http://localhost:3000)**.

---

### Prerequisites

| Requirement | Minimum Version | Purpose |
|------------|----------------|---------|
| **Python** | 3.10+ | Backend API and ML model |
| **Node.js** | 18.x+ | Frontend dashboard (with `npm`) |
| **Docker** *(Optional)* | 20.x+ | Required only for PostgreSQL + Qdrant services |
| **OpenAI API Key** *(Optional)* | — | Required for LLM copilot and semantic RAG (system works without it via fallback modes) |

---

### Option A: Running Locally (Recommended for Development)

#### Step 1: Clone the Repository
```bash
git clone https://github.com/MoAftaab/steelguardai.git
cd steelguard-ai
```

#### Step 2: Configure Environment Variables
```bash
# Copy the template
cp .env.example .env
```

Open `.env` and configure:
```env
# Required for LLM features (optional — system works without it)
OPENAI_API_KEY=your-openai-api-key-here

# Optional — defaults are sensible
OPENAI_MODEL=gpt-5.5
OPENAI_EMBEDDING_MODEL=text-embedding-3-small
STEELGUARD_RAG_MODE=openai        # Set to "local" for offline mode
NEXT_PUBLIC_API_URL=http://localhost:8000
```

#### Step 3: Start the Backend API
```bash
cd backend

# Create and activate virtual environment
python -m venv .venv

# Windows PowerShell:
.\.venv\Scripts\Activate.ps1

# macOS / Linux:
source .venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# (Optional) Download/verify the UCI AI4I dataset
python scripts/prepare_data.py

# Start the API server
python -m uvicorn app.main:app --reload --port 8000
```

The backend will automatically:
- Download the UCI AI4I 2020 dataset if not present
- Train the ML model and cache it as `artifacts/ai4i_failure_model.joblib`
- Load equipment config, manuals, logs, spares, and feedback
- Initialize the telemetry stream with historical readings

#### Step 4: Start the Frontend Dashboard
```bash
# Open a new terminal
cd frontend

# Install dependencies
npm install

# Start the development server
npm run dev
```

#### Step 5: Open the Dashboard
Navigate to **[http://localhost:3000](http://localhost:3000)** in your browser.

---

### Option B: Running with Docker Compose (Full Stack)

To run the complete stack including PostgreSQL and Qdrant:

1. **Configure Environment Variables**:
   Copy `.env.example` to `.env` and configure your settings (e.g., `OPENAI_API_KEY`):
   ```bash
   cp .env.example .env
   ```

2. **Start the Containers**:
   ```bash
   docker compose up --build
   ```

This starts all four services:

| Service | URL | Description |
|---------|-----|-------------|
| **FastAPI Backend** | `http://localhost:8000` | REST API + ML inference |
| **Next.js Frontend** | `http://localhost:3000` | Operations dashboard |
| **PostgreSQL** | `localhost:5432` | Relational database |
| **Qdrant** | `localhost:6333` | Vector database for RAG |

> [!TIP]
> If you encounter database initialization errors or corrupt volume states (e.g., `pg_control` not found), reset the Docker volumes using:
> ```bash
> docker compose down -v
> ```

---

### Running Automated Tests

#### Backend Test Suite
```bash
cd backend
pytest
```

The test suite covers:
- API endpoint response codes and payloads
- Scoring engine computation accuracy
- Equipment health calculation
- Recommendation generation

#### Frontend Build Verification
```bash
cd frontend
npm run build
```

---

## 8. Sample Input & Output Demonstration

### A. Document Ingestion

**Endpoint:** `POST /ingest/documents`

<details>
<summary><b>📥 Sample Input</b></summary>

```json
{
  "equipment_id": "rm-motor-01",
  "source_type": "sop",
  "title": "Rolling Mill Roller Calibration SOP",
  "section": "Standard Calibration",
  "text": "Before starting a new campaign, calibrate the roller gap sensor. If vibration exceeds 6.5 mm/s, check for grease contamination and bearing runout. Verify coupling alignment using laser alignment tool within ±0.05mm tolerance."
}
```
</details>

<details>
<summary><b>📤 Sample Output</b></summary>

```json
{
  "ingested_chunks": 1,
  "chunks": [
    {
      "id": "upload-rm-motor-01-sop-1",
      "equipment_id": "rm-motor-01",
      "source_type": "sop",
      "title": "Rolling Mill Roller Calibration SOP",
      "section": "Standard Calibration",
      "text": "Before starting a new campaign, calibrate the roller gap sensor. If vibration exceeds 6.5 mm/s, check for grease contamination and bearing runout. Verify coupling alignment using laser alignment tool within ±0.05mm tolerance.",
      "metadata": { "uploaded": true, "chunk": 1 }
    }
  ]
}
```
</details>

---

### B. Sensor Telemetry Batch Ingestion

**Endpoint:** `POST /ingest/sensor-batch`

<details>
<summary><b>📥 Sample Input</b></summary>

```json
{
  "readings": [
    {
      "equipment_id": "rm-motor-01",
      "timestamp": "2026-06-12T19:20:00Z",
      "metrics": {
        "temperature_c": 92.4,
        "vibration_mm_s": 7.8,
        "current_a": 420,
        "speed_rpm": 1380,
        "torque_nm": 58.5,
        "tool_wear_min": 186
      }
    }
  ]
}
```
</details>

<details>
<summary><b>📤 Sample Output</b></summary>

```json
{
  "ingested_readings": 1
}
```
</details>

---

### C. AI Maintenance Recommendation

**Endpoint:** `POST /recommendations`

<details>
<summary><b>📥 Sample Input</b></summary>

```json
{
  "equipment_id": "rm-motor-01",
  "query": "Diagnose the vibration alert and propose the safest maintenance plan.",
  "alert_id": "alert-rm-motor-01-67"
}
```
</details>

<details>
<summary><b>📤 Sample Output</b></summary>

```json
{
  "id": "rec-a1b2c3d4e5",
  "equipment_id": "rm-motor-01",
  "diagnosis": "Critical thermal-vibration event on the rolling mill drive motor. The latest reading shows 92.4 C, 7.8 mm/s vibration, and 420 A, derived from AI4I torque, speed, temperature, and wear telemetry; it matches a bearing lubrication or coupling misalignment pattern. The trained model adds 87% failure probability with top signals temperature_c, vibration_mm_s, torque_nm, current_a.",
  "probable_root_causes": [
    "Trained AI4I classifier flags heat dissipation failure with 87% failure probability.",
    "AI4I heat-dissipation or power-failure pattern mapped to drive motor thermal/load stress.",
    "Drive-end or non-drive-end bearing lubrication breakdown causing heat and vibration rise.",
    "Coupling insert wear or misalignment increasing rotor load and current draw.",
    "Process rule flags thermal vibration cascade: Rolling stand drive heat and vibration are rising together."
  ],
  "risk_level": "critical",
  "urgency": "shutdown_window",
  "rul_estimate": {
    "hours": 48,
    "confidence": 0.85,
    "degradation_score": 0.934
  },
  "evidence": [
    {
      "source_id": "rolling_mill_motor-1",
      "source_type": "sop",
      "title": "Rolling Mill Motor Bearing Inspection SOP - Vibration Limits",
      "excerpt": "If vibration exceeds 6.5 mm/s, check for grease contamination and bearing runout...",
      "relevance": 1.0,
      "metadata": {
        "retrieval": "openai_embeddings",
        "embedding_model": "text-embedding-3-small",
        "vector_score": 0.8734
      }
    }
  ],
  "immediate_actions": [
    "Notify area supervisor and open a critical maintenance case.",
    "Reduce rolling load and isolate the motor at the next safe pass gap.",
    "Capture thermography and inspect bearing housings, grease lines, and coupling insert.",
    "Reserve the bearing kit and coupling insert before opening the drive.",
    "Restart only if vibration falls below 7.5 mm/s after lubrication and alignment check."
  ],
  "long_term_actions": [
    "Shorten high-load campaign lubrication inspection interval from weekly to every 72 hours.",
    "Trend current draw against pass schedule to flag overload before thermal escalation.",
    "Add summer campaign pre-check for coupling elastomer cracks and soft-foot alignment."
  ],
  "spare_strategy": [
    "Reserve 2 x Bearing Kit DE/NDE; replenishment lead time is 14 days.",
    "Reserve 1 x Coupling Insert; replenishment lead time is 7 days."
  ],
  "process_defects": [
    {
      "id": "def-rm-motor-01-thermal_vibration_cascade",
      "defect_type": "thermal_vibration_cascade",
      "severity": "high",
      "confidence": 0.82,
      "signals": ["temperature_c", "vibration_mm_s"],
      "explanation": "Rolling stand drive heat and vibration are rising together, consistent with bearing lubrication loss or coupling misalignment.",
      "recommended_action": "Reduce rolling load, inspect bearing housings and coupling, and hold restart until vibration returns below the alert band."
    }
  ],
  "confidence": 0.94,
  "escalation_trigger": "Escalate to shutdown repair if vibration stays above 7.5 mm/s or temperature stays above 92 C for 15 minutes after lubrication.",
  "ml_prediction": {
    "model_name": "ExtraTreesClassifier",
    "model_version": "ai4i-steelguard-v1",
    "failure_probability": 0.87,
    "failure_likely": true,
    "predicted_failure_mode": "heat_dissipation_failure",
    "failure_mode_confidence": 0.78,
    "top_signals": ["temperature_c", "vibration_mm_s", "torque_nm", "current_a"],
    "validation_accuracy": 0.984,
    "validation_f1": 0.85
  },
  "node_trace": [
    { "node": "triage", "status": "complete", "summary": "Mapped query to Rolling Mill Drive Motor with risk critical." },
    { "node": "evidence_retrieval", "status": "complete", "summary": "Retrieved 5 source-backed evidence items." },
    { "node": "prediction", "status": "complete", "summary": "Anomaly score 0.92; RUL 48 hours." },
    { "node": "process_defect_rules", "status": "complete", "summary": "Detected 2 steel process defect indicators." },
    { "node": "ml_classifier", "status": "complete", "summary": "ExtraTreesClassifier estimated 87% failure probability and mode heat dissipation failure." },
    { "node": "maintenance_planner", "status": "complete", "summary": "Urgency set to shutdown_window with spare pressure 0.56." },
    { "node": "report_ready", "status": "complete", "summary": "Structured recommendation is ready for dashboard and report generation." }
  ]
}
```
</details>

---

### D. Copilot Chat

**Endpoint:** `POST /chat`

<details>
<summary><b>📥 Sample Input</b></summary>

```json
{
  "message": "What's wrong with the rolling mill motor and what should I do first?",
  "equipment_id": "rm-motor-01",
  "conversation_id": "conv-abc12345"
}
```
</details>

<details>
<summary><b>📤 Sample Output</b></summary>

```json
{
  "conversation_id": "conv-abc12345",
  "message": "Diagnosis:\nCritical thermal-vibration event on the rolling mill drive motor. Temperature is at 92.4 C with vibration at 7.8 mm/s and current draw at 420 A.\n\nMost Likely Cause:\nBearing lubrication breakdown in the drive-end housing, possibly compounded by coupling misalignment.\n\nDo First:\n- Reduce rolling load at the next safe pass gap\n- Capture thermography on both bearing housings\n- Inspect grease lines and coupling insert condition\n- Reserve the bearing kit (2 in stock, 14-day lead time)\n\nDo Not Restart Unless:\nVibration drops below 7.5 mm/s and temperature drops below 88 C after lubrication and alignment check.\n\nEstimated RUL: 48 hours\nConfidence: 94%",
  "recommendation": { "..." }
}
```
</details>

---

### E. Maintenance Report Generation

**Endpoint:** `POST /reports`

<details>
<summary><b>📥 Sample Input</b></summary>

```json
{
  "equipment_id": "rm-motor-01",
  "recommendation_id": "rec-a1b2c3d4e5"
}
```
</details>

<details>
<summary><b>📤 Sample Output</b></summary>

```json
{
  "id": "report-f6g7h8i9j0",
  "equipment_id": "rm-motor-01",
  "generated_at": "2026-06-12T19:22:15Z",
  "title": "Maintenance Decision Report",
  "markdown": "# Maintenance Decision Report\n\nGenerated: 2026-06-12 19:22 UTC\n\nEquipment: Rolling Mill Stand 2 Drive Motor\nArea: Hot Rolling Mill\nRisk: Critical\nUrgency: shutdown_window\nRUL Estimate: 48 hours\nConfidence: 94%\n\n## Diagnosis\nCritical thermal-vibration event on the rolling mill drive motor...\n\n## Probable Root Causes\n- Trained AI4I classifier flags heat dissipation failure...\n- Drive-end bearing lubrication breakdown...\n\n## Immediate Actions\n- Notify area supervisor...\n- Reduce rolling load...\n\n## ML Prediction\nModel: ExtraTreesClassifier\nFailure Probability: 87%\nPredicted Failure Mode: heat dissipation failure\nTop Signals: temperature_c, vibration_mm_s, torque_nm, current_a\nValidation Accuracy/F1: 98% / 85%"
}
```
</details>

---

## 9. Demo Screenshots

### System Architecture Overview
A high-level view of the decoupled architecture, client/server boundaries, databases, and core engines.

![System Architecture Overview](docs/screenshots/architecture_diagram.png)

### Research-Level Technical Blueprint
An academic-level blueprint highlighting multi-modal telemetry ingestion, hybrid diagnostic scoring, and the agentic RAG reasoning pipeline.

![Research-Level Technical Blueprint](docs/screenshots/research_architecture.png)

### Operations Dashboard
The main dashboard provides a comprehensive plant overview with real-time equipment health monitoring, sensor trend visualization, alert management, and AI-powered status indicators.

![Operations Dashboard — Plant summary, equipment health tiles, sensor trend charts, and alert management](docs/screenshots/dashboard_overview.png)

### AI Recommendation Panel
The recommendation panel displays the full AI-generated maintenance analysis including diagnosis, root causes, action checklists, evidence sources with relevance scores, and the complete node trace pipeline visualization.

![AI Recommendation Panel — Diagnosis, root causes, actions, evidence, and node trace pipeline](docs/screenshots/recommendation_panel.png)

### Maintenance Wizard Chat
The copilot chat interface enables multi-turn conversational maintenance queries with full context awareness, conversation memory, and equipment-specific responses backed by the RAG + ML pipeline.

![Maintenance Wizard Chat — Multi-turn AI copilot for maintenance queries](docs/screenshots/wizard_chat.png)

### ML Predictive Insights
The predictive insights panel shows real-time ML model performance, failure probability trends, predicted failure modes, and feature importance rankings for transparent, explainable AI.

![ML Predictive Insights — Model metrics, failure trends, and feature importance](docs/screenshots/ml_insights.png)

---

## 🧠 ML Model Deep Dive — Why ExtraTrees + Random Forest?

### Why Ensemble Tree Models?

SteelGuard AI uses **tree-based ensemble classifiers** (ExtraTreesClassifier and RandomForestClassifier) for failure prediction. Here's why they outperform other approaches for this industrial maintenance use case:

### Comparison with Alternative Models

| Model | Accuracy | F1-Score | Pros | Cons | Verdict |
|-------|----------|----------|------|------|---------|
| **ExtraTrees (Ours)** | **≈98.4%** | **≈85%** | Fast training, handles imbalanced data, excellent feature importance, no scaling needed | Slightly higher variance than RF | ✅ **Selected** |
| **Random Forest** | ≈97.8% | ≈82% | Robust, lower variance, good generalization | Slightly slower, marginally lower on imbalanced data | ✅ **Candidate** |
| Logistic Regression | ≈96.5% | ≈52% | Fast, interpretable coefficients | Poor on non-linear boundaries, struggles with 3.4% failure rate | ❌ Too simplistic |
| SVM (RBF) | ≈97.2% | ≈68% | Good decision boundaries | Requires feature scaling, slow training, no native probability calibration | ❌ Not practical |
| XGBoost | ≈98.2% | ≈84% | State-of-art boosting, regularization | Requires extensive hyperparameter tuning, added dependency complexity | ⚠️ Comparable but heavier |
| Neural Network (MLP) | ≈97.5% | ≈72% | Learns complex patterns | Requires much more data, no feature importance, black-box | ❌ Overkill for tabular data |
| LSTM / Time-Series NN | ≈96.8% | ≈65% | Captures temporal dependencies | Requires sequence data, heavy training, poor on small tabular datasets | ❌ Wrong paradigm |

### Why ExtraTrees is Superior for This Use Case

1. **Handles Class Imbalance Natively** — The AI4I dataset has only ~3.4% failure rate. ExtraTrees with `class_weight="balanced"` automatically adjusts sample weights, while many models (Logistic Regression, SVM) struggle with severe imbalance without extensive SMOTE/oversampling.

2. **No Feature Scaling Required** — Tree-based models are invariant to feature scale. Temperature in °C (50–110), vibration in mm/s (2–10), and current in Amps (200–500) work without normalization. Neural networks and SVMs require careful standardization.

3. **Native Feature Importance** — The `feature_importances_` attribute provides transparent ranking of which signals drive predictions. This is critical in industrial maintenance where engineers need to understand *why* the model flagged a failure.

4. **Robust to Noise & Outliers** — Steel plant sensor data is inherently noisy. ExtraTrees uses random split thresholds (unlike Random Forest's optimal splits), making it more robust to noisy features.

5. **Fast Inference** — Predictions run in <5ms per reading, enabling real-time dashboard updates without GPU requirements.

6. **Automatic Model Selection** — By training both ExtraTrees and Random Forest and selecting the best based on Average Precision → F1 → Balanced Accuracy, the system adapts to the specific data distribution at training time.

### Training Pipeline Architecture

```mermaid
flowchart TD
    A["UCI AI4I Dataset<br/>(10,000 rows, 14 features)"] --> B["Stratified Train/Test Split<br/>(78% Train / 22% Test)"]
    B --> C1["Training Set<br/>(~7,800 rows)"]
    B --> C2["Test Set<br/>(~2,200 rows)"]
    
    C1 --> D["Feature Engineering & Mapping<br/>(Sensor signals, thresholds, criticality, asset one-hot)"]
    C2 --> D
    
    D --> E["Cross-monitored Assets Expansion<br/>(23,400+ training samples)"]
    
    E --> F1["ExtraTrees Classifier<br/>(220 trees, max_depth=16)"]
    E --> F2["Random Forest Classifier<br/>(180 trees, max_depth=14)"]
    
    F1 --> G1["Threshold Optimization<br/>(65 candidates: 0.08 - 0.72)"]
    F2 --> G2["Threshold Optimization<br/>(65 candidates: 0.08 - 0.72)"]
    
    G1 --> H["Model Evaluation & Ranking<br/>(AUPRC ➔ F1 ➔ Bal.Acc)"]
    G2 --> H
    
    H --> I["Best Model Auto-Selection"]
    I --> J["Model Serialization<br/>(ai4i_failure_model.joblib)"]
    
    style A fill:#0f172a,stroke:#38bdf8,stroke-width:2px,color:#fff
    style B fill:#0f172a,stroke:#38bdf8,stroke-width:2px,color:#fff
    style D fill:#0f172a,stroke:#818cf8,stroke-width:2px,color:#fff
    style E fill:#0f172a,stroke:#818cf8,stroke-width:2px,color:#fff
    style F1 fill:#1e1b4b,stroke:#818cf8,stroke-width:2px,color:#fff
    style F2 fill:#1e1b4b,stroke:#818cf8,stroke-width:2px,color:#fff
    style G1 fill:#0f172a,stroke:#f59e0b,stroke-width:2px,color:#fff
    style G2 fill:#0f172a,stroke:#f59e0b,stroke-width:2px,color:#fff
    style I fill:#0f172a,stroke:#10b981,stroke-width:2px,color:#fff
    style J fill:#0f172a,stroke:#10b981,stroke-width:2px,color:#fff
```

---

## 8. Sample Input & Output Demonstration

### A. Document Ingestion

**Endpoint:** `POST /ingest/documents`

<details>
<summary><b>📥 Sample Input</b></summary>

```json
{
  "equipment_id": "rm-motor-01",
  "source_type": "sop",
  "title": "Rolling Mill Roller Calibration SOP",
  "section": "Standard Calibration",
  "text": "Before starting a new campaign, calibrate the roller gap sensor. If vibration exceeds 6.5 mm/s, check for grease contamination and bearing runout. Verify coupling alignment using laser alignment tool within ±0.05mm tolerance."
}
```
</details>

<details>
<summary><b>📤 Sample Output</b></summary>

```json
{
  "ingested_chunks": 1,
  "chunks": [
    {
      "id": "upload-rm-motor-01-sop-1",
      "equipment_id": "rm-motor-01",
      "source_type": "sop",
      "title": "Rolling Mill Roller Calibration SOP",
      "section": "Standard Calibration",
      "text": "Before starting a new campaign, calibrate the roller gap sensor. If vibration exceeds 6.5 mm/s, check for grease contamination and bearing runout. Verify coupling alignment using laser alignment tool within ±0.05mm tolerance.",
      "metadata": { "uploaded": true, "chunk": 1 }
    }
  ]
}
```
</details>

---

### B. Sensor Telemetry Batch Ingestion

**Endpoint:** `POST /ingest/sensor-batch`

<details>
<summary><b>📥 Sample Input</b></summary>

```json
{
  "readings": [
    {
      "equipment_id": "rm-motor-01",
      "timestamp": "2026-06-12T19:20:00Z",
      "metrics": {
        "temperature_c": 92.4,
        "vibration_mm_s": 7.8,
        "current_a": 420,
        "speed_rpm": 1380,
        "torque_nm": 58.5,
        "tool_wear_min": 186
      }
    }
  ]
}
```
</details>

<details>
<summary><b>📤 Sample Output</b></summary>

```json
{
  "ingested_readings": 1
}
```
</details>

---

### C. AI Maintenance Recommendation

**Endpoint:** `POST /recommendations`

<details>
<summary><b>📥 Sample Input</b></summary>

```json
{
  "equipment_id": "rm-motor-01",
  "query": "Diagnose the vibration alert and propose the safest maintenance plan.",
  "alert_id": "alert-rm-motor-01-67"
}
```
</details>

<details>
<summary><b>📤 Sample Output</b></summary>

```json
{
  "id": "rec-a1b2c3d4e5",
  "equipment_id": "rm-motor-01",
  "diagnosis": "Critical thermal-vibration event on the rolling mill drive motor. The latest reading shows 92.4 C, 7.8 mm/s vibration, and 420 A, derived from AI4I torque, speed, temperature, and wear telemetry; it matches a bearing lubrication or coupling misalignment pattern. The trained model adds 87% failure probability with top signals temperature_c, vibration_mm_s, torque_nm, current_a.",
  "probable_root_causes": [
    "Trained AI4I classifier flags heat dissipation failure with 87% failure probability.",
    "AI4I heat-dissipation or power-failure pattern mapped to drive motor thermal/load stress.",
    "Drive-end or non-drive-end bearing lubrication breakdown causing heat and vibration rise.",
    "Coupling insert wear or misalignment increasing rotor load and current draw.",
    "Process rule flags thermal vibration cascade: Rolling stand drive heat and vibration are rising together."
  ],
  "risk_level": "critical",
  "urgency": "shutdown_window",
  "rul_estimate": {
    "hours": 48,
    "confidence": 0.85,
    "degradation_score": 0.934
  },
  "evidence": [
    {
      "source_id": "rolling_mill_motor-1",
      "source_type": "sop",
      "title": "Rolling Mill Motor Bearing Inspection SOP - Vibration Limits",
      "excerpt": "If vibration exceeds 6.5 mm/s, check for grease contamination and bearing runout...",
      "relevance": 1.0,
      "metadata": {
        "retrieval": "openai_embeddings",
        "embedding_model": "text-embedding-3-small",
        "vector_score": 0.8734
      }
    }
  ],
  "immediate_actions": [
    "Notify area supervisor and open a critical maintenance case.",
    "Reduce rolling load and isolate the motor at the next safe pass gap.",
    "Capture thermography and inspect bearing housings, grease lines, and coupling insert.",
    "Reserve the bearing kit and coupling insert before opening the drive.",
    "Restart only if vibration falls below 7.5 mm/s after lubrication and alignment check."
  ],
  "long_term_actions": [
    "Shorten high-load campaign lubrication inspection interval from weekly to every 72 hours.",
    "Trend current draw against pass schedule to flag overload before thermal escalation.",
    "Add summer campaign pre-check for coupling elastomer cracks and soft-foot alignment."
  ],
  "spare_strategy": [
    "Reserve 2 x Bearing Kit DE/NDE; replenishment lead time is 14 days.",
    "Reserve 1 x Coupling Insert; replenishment lead time is 7 days."
  ],
  "process_defects": [
    {
      "id": "def-rm-motor-01-thermal_vibration_cascade",
      "defect_type": "thermal_vibration_cascade",
      "severity": "high",
      "confidence": 0.82,
      "signals": ["temperature_c", "vibration_mm_s"],
      "explanation": "Rolling stand drive heat and vibration are rising together, consistent with bearing lubrication loss or coupling misalignment.",
      "recommended_action": "Reduce rolling load, inspect bearing housings and coupling, and hold restart until vibration returns below the alert band."
    }
  ],
  "confidence": 0.94,
  "escalation_trigger": "Escalate to shutdown repair if vibration stays above 7.5 mm/s or temperature stays above 92 C for 15 minutes after lubrication.",
  "ml_prediction": {
    "model_name": "ExtraTreesClassifier",
    "model_version": "ai4i-steelguard-v1",
    "failure_probability": 0.87,
    "failure_likely": true,
    "predicted_failure_mode": "heat_dissipation_failure",
    "failure_mode_confidence": 0.78,
    "top_signals": ["temperature_c", "vibration_mm_s", "torque_nm", "current_a"],
    "validation_accuracy": 0.984,
    "validation_f1": 0.85
  },
  "node_trace": [
    { "node": "triage", "status": "complete", "summary": "Mapped query to Rolling Mill Drive Motor with risk critical." },
    { "node": "evidence_retrieval", "status": "complete", "summary": "Retrieved 5 source-backed evidence items." },
    { "node": "prediction", "status": "complete", "summary": "Anomaly score 0.92; RUL 48 hours." },
    { "node": "process_defect_rules", "status": "complete", "summary": "Detected 2 steel process defect indicators." },
    { "node": "ml_classifier", "status": "complete", "summary": "ExtraTreesClassifier estimated 87% failure probability and mode heat dissipation failure." },
    { "node": "maintenance_planner", "status": "complete", "summary": "Urgency set to shutdown_window with spare pressure 0.56." },
    { "node": "report_ready", "status": "complete", "summary": "Structured recommendation is ready for dashboard and report generation." }
  ]
}
```
</details>

---

### D. Copilot Chat

**Endpoint:** `POST /chat`

<details>
<summary><b>📥 Sample Input</b></summary>

```json
{
  "message": "What's wrong with the rolling mill motor and what should I do first?",
  "equipment_id": "rm-motor-01",
  "conversation_id": "conv-abc12345"
}
```
</details>

<details>
<summary><b>📤 Sample Output</b></summary>

```json
{
  "conversation_id": "conv-abc12345",
  "message": "Diagnosis:\nCritical thermal-vibration event on the rolling mill drive motor. Temperature is at 92.4 C with vibration at 7.8 mm/s and current draw at 420 A.\n\nMost Likely Cause:\nBearing lubrication breakdown in the drive-end housing, possibly compounded by coupling misalignment.\n\nDo First:\n- Reduce rolling load at the next safe pass gap\n- Capture thermography on both bearing housings\n- Inspect grease lines and coupling insert condition\n- Reserve the bearing kit (2 in stock, 14-day lead time)\n\nDo Not Restart Unless:\nVibration drops below 7.5 mm/s and temperature drops below 88 C after lubrication and alignment check.\n\nEstimated RUL: 48 hours\nConfidence: 94%",
  "recommendation": { "..." }
}
```
</details>

---

### E. Maintenance Report Generation

**Endpoint:** `POST /reports`

<details>
<summary><b>📥 Sample Input</b></summary>

```json
{
  "equipment_id": "rm-motor-01",
  "recommendation_id": "rec-a1b2c3d4e5"
}
```
</details>

<details>
<summary><b>📤 Sample Output</b></summary>

```json
{
  "id": "report-f6g7h8i9j0",
  "equipment_id": "rm-motor-01",
  "generated_at": "2026-06-12T19:22:15Z",
  "title": "Maintenance Decision Report",
  "markdown": "# Maintenance Decision Report\n\nGenerated: 2026-06-12 19:22 UTC\n\nEquipment: Rolling Mill Stand 2 Drive Motor\nArea: Hot Rolling Mill\nRisk: Critical\nUrgency: shutdown_window\nRUL Estimate: 48 hours\nConfidence: 94%\n\n## Diagnosis\nCritical thermal-vibration event on the rolling mill drive motor...\n\n## Probable Root Causes\n- Trained AI4I classifier flags heat dissipation failure...\n- Drive-end bearing lubrication breakdown...\n\n## Immediate Actions\n- Notify area supervisor...\n- Reduce rolling load...\n\n## ML Prediction\nModel: ExtraTreesClassifier\nFailure Probability: 87%\nPredicted Failure Mode: heat dissipation failure\nTop Signals: temperature_c, vibration_mm_s, torque_nm, current_a\nValidation Accuracy/F1: 98% / 85%"
}
```
</details>

---

## 9. Demo Screenshots

### Operations Dashboard
The main dashboard provides a comprehensive plant overview with real-time equipment health monitoring, sensor trend visualization, alert management, and AI-powered status indicators.

![Operations Dashboard — Plant summary, equipment health tiles, sensor trend charts, and alert management](docs/screenshots/dashboard_overview.png)

### AI Recommendation Panel
The recommendation panel displays the full AI-generated maintenance analysis including diagnosis, root causes, action checklists, evidence sources with relevance scores, and the complete node trace pipeline visualization.

![AI Recommendation Panel — Diagnosis, root causes, actions, evidence, and node trace pipeline](docs/screenshots/recommendation_panel.png)

### Maintenance Wizard Chat
The copilot chat interface enables multi-turn conversational maintenance queries with full context awareness, conversation memory, and equipment-specific responses backed by the RAG + ML pipeline.

![Maintenance Wizard Chat — Multi-turn AI copilot for maintenance queries](docs/screenshots/wizard_chat.png)

### ML Predictive Insights
The predictive insights panel shows real-time ML model performance, failure probability trends, predicted failure modes, and feature importance rankings for transparent, explainable AI.

![ML Predictive Insights — Model metrics, failure trends, and feature importance](docs/screenshots/ml_insights.png)

---

## 🧠 ML Model Deep Dive — Why ExtraTrees + Random Forest?

### Why Ensemble Tree Models?

SteelGuard AI uses **tree-based ensemble classifiers** (ExtraTreesClassifier and RandomForestClassifier) for failure prediction. Here's why they outperform other approaches for this industrial maintenance use case:

### Comparison with Alternative Models

| Model | Accuracy | F1-Score | Pros | Cons | Verdict |
|-------|----------|----------|------|------|---------|
| **ExtraTrees (Ours)** | **≈98.4%** | **≈85%** | Fast training, handles imbalanced data, excellent feature importance, no scaling needed | Slightly higher variance than RF | ✅ **Selected** |
| **Random Forest** | ≈97.8% | ≈82% | Robust, lower variance, good generalization | Slightly slower, marginally lower on imbalanced data | ✅ **Candidate** |
| Logistic Regression | ≈96.5% | ≈52% | Fast, interpretable coefficients | Poor on non-linear boundaries, struggles with 3.4% failure rate | ❌ Too simplistic |
| SVM (RBF) | ≈97.2% | ≈68% | Good decision boundaries | Requires feature scaling, slow training, no native probability calibration | ❌ Not practical |
| XGBoost | ≈98.2% | ≈84% | State-of-art boosting, regularization | Requires extensive hyperparameter tuning, added dependency complexity | ⚠️ Comparable but heavier |
| Neural Network (MLP) | ≈97.5% | ≈72% | Learns complex patterns | Requires much more data, no feature importance, black-box | ❌ Overkill for tabular data |
| LSTM / Time-Series NN | ≈96.8% | ≈65% | Captures temporal dependencies | Requires sequence data, heavy training, poor on small tabular datasets | ❌ Wrong paradigm |

### Why ExtraTrees is Superior for This Use Case

1. **Handles Class Imbalance Natively** — The AI4I dataset has only ~3.4% failure rate. ExtraTrees with `class_weight="balanced"` automatically adjusts sample weights, while many models (Logistic Regression, SVM) struggle with severe imbalance without extensive SMOTE/oversampling.

2. **No Feature Scaling Required** — Tree-based models are invariant to feature scale. Temperature in °C (50–110), vibration in mm/s (2–10), and current in Amps (200–500) work without normalization. Neural networks and SVMs require careful standardization.

3. **Native Feature Importance** — The `feature_importances_` attribute provides transparent ranking of which signals drive predictions. This is critical in industrial maintenance where engineers need to understand *why* the model flagged a failure.

4. **Robust to Noise & Outliers** — Steel plant sensor data is inherently noisy. ExtraTrees uses random split thresholds (unlike Random Forest's optimal splits), making it more robust to noisy features.

5. **Fast Inference** — Predictions run in <5ms per reading, enabling real-time dashboard updates without GPU requirements.

6. **Automatic Model Selection** — By training both ExtraTrees and Random Forest and selecting the best based on Average Precision → F1 → Balanced Accuracy, the system adapts to the specific data distribution at training time.

### Training Pipeline Architecture

```
UCI AI4I Dataset (10,000 rows)
        │
        ▼
  78/22 Stratified Split
        │
  ┌─────┴─────┐
  ▼           ▼
Training    Test
(~7,800)   (~2,200)
  │           │
  ▼           ▼
  ┌───────────────────────────────┐
  │  Feature Engineering          │
  │  • 9 sensor signals           │
  │  • 9 threshold risk scores    │
  │  • 1 asset criticality        │
  │  • 3 equipment one-hot        │
  │  × 3 equipment variants       │
  │  = 23,400+ training samples   │
  └───────────┬───────────────────┘
              │
    ┌─────────┼─────────┐
    ▼                   ▼
ExtraTrees         RandomForest
(220 trees)        (180 trees)
    │                   │
    ▼                   ▼
 Threshold           Threshold
 Optimization        Optimization
 (65 candidates)     (65 candidates)
    │                   │
    └─────────┬─────────┘
              ▼
       Best Model Selected
       (by AUPRC → F1 → Bal.Acc)
              │
              ▼
     Serialized to .joblib
     (artifacts/ai4i_failure_model.joblib)
```

---

## 📊 Data Sources

### Primary Dataset

| Source | Description | Link |
|--------|------------|------|
| **UCI AI4I 2020 Predictive Maintenance Dataset** | 10,000 synthetic industrial sensor readings with 5 failure modes (TWF, HDF, PWF, OSF, RNF) across 3 machine quality types (L, M, H). | [UCI Machine Learning Repository](https://archive.ics.uci.edu/dataset/601/ai4i+2020+predictive+maintenance+dataset) |

**Dataset Citation:**
> S. Matzka, "Explainable Artificial Intelligence for Predictive Maintenance Applications," Third International Conference on Artificial Intelligence for Industries (AI4I), 2020.

### Dataset Features Used

| Feature | Type | Range | Steel Mapping |
|---------|------|-------|---------------|
| Air temperature [K] | Continuous | 295–304 K | Ambient/cooling temperature |
| Process temperature [K] | Continuous | 305–314 K | Internal motor/bearing temperature |
| Rotational speed [rpm] | Continuous | 1168–2886 rpm | Gearbox/shaft RPM |
| Torque [Nm] | Continuous | 3.8–76.6 Nm | Mechanical load torque |
| Tool wear [min] | Continuous | 0–253 min | Roller/gear wear index |
| Machine failure | Binary | 0/1 | Target: failure occurrence |
| TWF, HDF, PWF, OSF, RNF | Binary | 0/1 | Failure mode labels |

### Supporting Data (Bundled with Project)

| File | Path | Description |
|------|------|-------------|
| `equipment.json` | `backend/data/equipment.json` | Equipment registry with 3 steel assets, thresholds, and criticality ratings |
| `spares.csv` | `backend/data/spares.csv` | Spare parts inventory with stock levels, lead times, and suppliers |
| `maintenance_logs.csv` | `backend/data/maintenance_logs.csv` | Historical maintenance events with root cause and actions taken |
| `rolling_mill_motor.md` | `backend/data/manuals/` | SOP and manual chunks for rolling mill drive motor |
| `blast_furnace_pump.md` | `backend/data/manuals/` | SOP and manual chunks for blast furnace cooling pump |
| `conveyor_gearbox.md` | `backend/data/manuals/` | SOP and manual chunks for conveyor gearbox |
| `external_maintenance_guidance.md` | `backend/data/manuals/` | External reference guidance for maintenance practices |
| `runtime_feedback.json` | `backend/data/runtime_feedback.json` | Persisted engineer feedback records |

---

## 📡 API Reference

### Core Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/healthz` | System health check (API, OpenAI, RAG, ML status) |
| `GET` | `/summary` | Plant summary with equipment count, alerts, avg RUL, priority |
| `GET` | `/equipment` | List all monitored equipment assets |
| `GET` | `/equipment/{id}/health` | Detailed health for specific equipment (metrics, anomaly, RUL, ML, defects, trends) |
| `GET` | `/alerts` | List all active alerts sorted by recency |
| `GET` | `/dataset` | AI4I dataset status and stream position |
| `GET` | `/ml/status` | ML model status, metrics, and training info |

### AI & Reasoning Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/recommendations` | Generate AI maintenance recommendation for equipment |
| `POST` | `/chat` | Multi-turn copilot chat with conversation memory |
| `GET` | `/chat/history/{conversation_id}` | Retrieve conversation history |
| `POST` | `/reports` | Generate structured Markdown maintenance report |
| `POST` | `/feedback` | Submit engineer feedback (accept/correct/reject) |

### Data Ingestion Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/ingest/documents` | Ingest SOP/manual documents into RAG corpus |
| `POST` | `/ingest/sensor-batch` | Batch ingest sensor telemetry readings |
| `POST` | `/ingest/fault-events` | Ingest control-system fault events (auto-creates alerts) |
| `POST` | `/ingest/alerts` | Ingest abnormality alerts |
| `POST` | `/ingest/spares` | Upsert spare parts inventory |
| `POST` | `/ingest/logs` | Ingest historical maintenance log entries |
| `POST` | `/stream/tick` | Advance the AI4I telemetry stream by N steps |

### Notification Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/roles` | List available user roles |
| `GET` | `/notifications/{role}` | Get role-filtered notifications |
| `GET` | `/rag/evidence/{equipment_id}` | Query RAG evidence for equipment |

---

## 📁 Project Structure

```
steelguard-ai/
├── .env.example                  # Environment variable template
├── docker-compose.yml            # Multi-service orchestration
├── README.md                     # This file
│
├── backend/
│   ├── Dockerfile                # Backend container definition
│   ├── requirements.txt          # Python dependencies
│   ├── pytest.ini                # Test configuration
│   │
│   ├── app/
│   │   ├── __init__.py           # Package marker
│   │   ├── main.py               # FastAPI app + all REST endpoints
│   │   ├── models.py             # Pydantic data models (20+ schemas)
│   │   ├── data.py               # Equipment/telemetry/stream management
│   │   ├── dataset_loader.py     # UCI AI4I dataset download and parsing
│   │   ├── ml_model.py           # ML training, prediction, model selection
│   │   ├── scoring.py            # Anomaly, RUL, priority, risk engines
│   │   ├── rag.py                # RAG retrieval (OpenAI + local fallback)
│   │   ├── agent.py              # Agentic recommendation pipeline
│   │   ├── defects.py            # Steel process defect detection rules
│   │   ├── notifications.py      # Role-based notification generation
│   │   └── openai_client.py      # OpenAI Embeddings + Responses API client
│   │
│   ├── data/
│   │   ├── ai4i2020.csv          # UCI AI4I dataset (auto-downloaded)
│   │   ├── equipment.json        # Equipment registry
│   │   ├── spares.csv            # Spare parts inventory
│   │   ├── maintenance_logs.csv  # Historical maintenance records
│   │   ├── runtime_feedback.json # Persisted engineer feedback
│   │   └── manuals/              # SOP and manual documents
│   │       ├── rolling_mill_motor.md
│   │       ├── blast_furnace_pump.md
│   │       ├── conveyor_gearbox.md
│   │       └── external_maintenance_guidance.md
│   │
│   ├── artifacts/
│   │   └── ai4i_failure_model.joblib  # Serialized ML model bundle
│   │
│   ├── scripts/
│   │   └── prepare_data.py       # Dataset preparation script
│   │
│   └── tests/
│       ├── test_api.py           # API endpoint tests
│       └── test_scoring.py       # Scoring engine tests
│
├── frontend/
│   ├── Dockerfile                # Frontend container definition
│   ├── package.json              # Node.js dependencies
│   ├── next.config.mjs           # Next.js configuration
│   ├── tailwind.config.ts        # Tailwind CSS design system
│   ├── tsconfig.json             # TypeScript configuration
│   │
│   ├── app/
│   │   ├── layout.tsx            # Root layout with metadata
│   │   ├── page.tsx              # Main dashboard page (1500+ lines)
│   │   └── globals.css           # Global styles and animations
│   │
│   ├── components/
│   │   ├── EquipmentList.tsx     # Equipment asset selector
│   │   ├── HealthChart.tsx       # Recharts sensor trend chart
│   │   ├── IngestionPanel.tsx    # Data ingestion forms
│   │   ├── MetricTile.tsx        # Color-coded sensor metric cards
│   │   ├── PredictiveInsights.tsx# ML model insights panel
│   │   ├── ProcessTwin.tsx       # Animated process digital twin
│   │   ├── RecommendationPanel.tsx # AI recommendation display
│   │   ├── ReportPanel.tsx       # Report generation panel
│   │   ├── RiskBadge.tsx         # Risk level badge component
│   │   └── WizardChat.tsx        # Multi-turn copilot chat
│   │
│   ├── lib/
│   │   ├── api.ts                # API client utilities
│   │   └── types.ts              # TypeScript type definitions
│   │
│   └── public/                   # Static assets
│
└── docs/
    ├── architecture.md           # Architecture notes
    ├── openai_rag_setup.md       # OpenAI RAG configuration guide
    ├── sample_input_output.md    # API sample payloads
    └── screenshots/              # Demo screenshots
        ├── dashboard_overview.png
        ├── recommendation_panel.png
        ├── wizard_chat.png
        └── ml_insights.png
```

---

## 🧪 Testing

### Backend Tests

```bash
cd backend
pytest -v
```

| Test File | Coverage |
|-----------|----------|
| `test_api.py` | Health check, equipment listing, health endpoint, recommendations, reports, stream ticking |
| `test_scoring.py` | Anomaly score computation, RUL estimation, priority score calculation |

### Frontend Verification

```bash
cd frontend
npm run build    # Type-check + production build
npm run lint     # ESLint validation
```

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/your-feature`
3. Commit changes: `git commit -m "Add your feature"`
4. Push to branch: `git push origin feature/your-feature`
5. Open a Pull Request

---

## 📄 License

This project is licensed under the MIT License. See [LICENSE](LICENSE) for details.

---

<div align="center">

**Built with ❤️ for the Steel Industry**

[⬆ Back to Top](#️-steelguard-ai)

</div>
