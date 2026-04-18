# PlaceMint 🚀

> A production-ready, scalable MERN microservices platform for college placement management.

PlaceMint is designed to handle the complex workflows of a university placement cell (TPO) and its students. It features a fully decoupled microservices architecture, event-driven communication via RabbitMQ, high-performance caching with Redis, an AI mock-interview engine powered by Gemini, and a modern React frontend.

---

## 🏗️ Architecture Overview

PlaceMint is built on a distributed microservices model. This ensures that high-load domains (like Job Searching) scale independently from lightweight domains (like Announcements), and that failures are isolated.

### System Flow
```text
          [ Web Client / React ]
                   │
                   ▼
          [ API Gateway (Nginx) ]
        (Port 5000, Request Routing)
                   │
      ┌────────────┼────────────────┐
      ▼            ▼                ▼
 [Core Svcs] [Support Svc (5006)] [Feature Svcs] 
      │            │                │
      └────────────┼────────────────┘
                   │
          [ Event Bus (RabbitMQ) ]
                   │
          [   Data & Caching   ]
      (MongoDB per service / Redis)
```

### 📐 Deployment Architecture

PlaceMint is deployed as **7 independent microservices** for optimal scalability and resilience:

- **API Gateway** (Nginx): Single entry point for all client requests, routing to backend services
- **Core Services** (3): `auth-service` (identity + profiles), `job-service`, `application-service`
- **Support Service** (1): **Modular consolidation** handling announcements, hackathons, tasks, messaging, skills, and quizzes—each domain retains its own route namespace and separate MongoDB connection for logical separation
- **Feature Services** (2): `notification-service`, `interview-service` (AI-powered)

This architecture ensures high-load domains scale independently while keeping deployments lean and maintainable.

## 🤖 AI Features

PlaceMint goes beyond a traditional placement portal by integrating an AI-powered mock interview engine.

- Real-time interview sessions powered by Gemini API
- Dynamic question generation based on student profile and target role
- Adaptive follow-up questions that simulate real HR and technical interviews
- Automated feedback, scoring, and communication analysis
- Helps students practice before actual placement drives

### 📦 Services Taxonomy

| Tier | Service | Port | DB | Responsibility |
|------|---------|------|----|----------------|
| **Gateway** | `api-gateway` | 5000 | - | Reverse proxy, path routing, CORS handling |
| **Core** | `auth-service` | 5001 | MongoDB (`authdb`, `profiledb`) | JWT issuance, RBAC, User models, password reset, Student profiles, resume uploads |
| **Core** | `job-service` | 5003 | MongoDB (`jobdb`) | Job postings, eligibility filtering |
| **Core** | `application-service`| 5004 | MongoDB (`applicationdb`) | Job applications, state tracking |
| **Support**| `notification-service`| 5005 | MongoDB (`notifydb`) | Email delivery via Nodemailer + Gmail SMTP, OTP generation |
| **Support**| `support-service` | 5006 | MongoDB (multi-conn) | **Consolidated**: Announcements, Hackathons, Tasks (Judge0), Messaging, Skills (stateless), Quizzes |
| **Feature**| `interview-service` | 5011 | MongoDB (`interviewdb`) | AI-powered real-time mock interviews, Gemini API integration, feedback generation |

---

## ⚙️ Tech Stack & Design Rationale

- **Node.js + Express**: Fast, non-blocking I/O ideal for API-heavy microservices.
- **MongoDB**: Used independently per service (Database-per-Service pattern) to ensure loose coupling.
- **Redis**: Caching layer for OTPs, password reset tokens, and frequent read operations to reduce DB load.
- **RabbitMQ**: Advanced Message Queuing Protocol (AMQP) broker. Used for asynchronous cross-service communication (e.g., triggering a high-volume email blast when a new job is posted without blocking the Job Service).
- **Nginx**: High-performance API Gateway routing layer.
- **Docker & Docker Compose**: Ensures identical environments across dev, staging, and production.
- **Winston**: Structured JSON logging across all services.

### 🔄 Real Use-Case Flow Example

1. **Student applies to a job:**
   - UI sends application request to Gateway (`:5000/api/applications`).
   - Gateway routes to `application-service`.
   - `application-service` validates token via `auth-service` and eligibility via `job-service`.
   - Application is saved to MongoDB.
   - `application-service` publishes an `application_submitted` event to **RabbitMQ**.
2. **Asynchronous Notification:**
   - `notification-service` listens to the RabbitMQ queue.
   - It receives the event and sends an email via Nodemailer using Gmail SMTP, completely outside the critical path of the student's request.

---

## 🔌 Setup & Installation (Docker)

PlaceMint is fully containerized. You only need Docker and Docker Compose installed.

### 1. Environment Configuration
Copy the root `.env.example` to `.env` and fill in your credentials.
```bash
cp .env.example .env
```
*(Note: There are also individual `.env.example` files in each service directory if you wish to run a single service outside of Docker).*

### Required Root Environment Variables

```env
JWT_SECRET=your_secure_random_secret_min_32_chars
GMAIL_USER=your-email@gmail.com
GMAIL_PASS=your-app-password
RABBITMQ_URL=amqp://rabbitmq:5672
REDIS_URL=redis://redis:6379
MONGO_URI_AUTH=mongodb://auth-mongo:27017/authdb
```

> Use a Gmail App Password, not your normal Gmail password.
> Generate a secure `JWT_SECRET` of at least 32 characters.

### Gmail SMTP Setup

The `notification-service` uses Gmail SMTP through Nodemailer.

If using a Gmail account with 2-factor authentication enabled, create an App Password and use it in `GMAIL_PASS` instead of your normal Gmail password.

### Recent Updates

- Unified email templates around Gmail SMTP variables (`MAIL_HOST`, `MAIL_PORT`, `MAIL_USER`, `MAIL_PASS`, `MAIL_FROM`) across services.
- Added Docker env wiring updates for auth and notification services to avoid local startup mismatch.
- Improved Gemini interview lifecycle with stricter low-effort answer checks and auto-generated score/feedback at interview end.
- Removed stale SendGrid dependency from auth-service after SMTP migration.

### 2. Seed the TPO Admin User
A secure script is provided to seed the initial TPO (Placement Cell) Admin account using the credentials defined in your `.env`.
```bash
npm install mongoose bcryptjs dotenv
npm run seed:tpo
```

### 3. Spin Up the Cluster
```bash
docker compose up -d --build
```

If services fail at boot due to missing values, verify root `.env` has mail and AI keys populated:

```env
MAIL_HOST=smtp.gmail.com
MAIL_PORT=587
MAIL_USER=your_email@gmail.com
MAIL_PASS=your_gmail_app_password
MAIL_FROM=your_email@gmail.com
GEMINI_API_KEY=your_gemini_api_key_here
```

- **Frontend UI:** `http://localhost:3000`
- **API Gateway:** `http://localhost:5000`
- **RabbitMQ Admin:** `http://localhost:15672` (if enabled in compose)

---

## 🔐 Authentication & Security

- **JWT Auth**: Stateless JSON Web Tokens valid for 1 day.
- **RBAC**: Three primary roles (`student`, `placementcell`, `admin`). Endpoints are protected via custom middleware.
- **Environment Isolation**: No hardcoded credentials. All secrets injected at runtime.
- **Rate Limiting / CORS**: Configured securely at the Nginx Gateway level.
- **Structured Error Handling**: All services return unified JSON error objects (`{ "success": false, "message": "..." }`) and structured `/health` endpoints.

---

> Built for reliability, designed for scale. 🚀
