# PlaceMint Deployment Guide (Vercel + Railway)

## Target Architecture

Frontend (Vercel)
-> API Gateway + microservices (Railway)
-> MongoDB Atlas + Redis + RabbitMQ

## 1) Deploy Backend Services on Railway

Create one Railway project and add these services from this repo, each using its own Dockerfile:

- backend/auth-service
- backend/profile-service
- backend/job-service
- backend/application-service
- backend/notification-service
- backend/skills-service
- backend/quiz-service
- backend/announcement-service
- backend/hackathon-service
- backend/task-service
- backend/interview-service
- backend/messaging-service

For each service:
- Root directory: the service folder above
- Builder: Dockerfile (auto-detected)
- Exposed port: Railway provides PORT automatically

## 2) Add Shared Infrastructure

In the same Railway project, add:
- MongoDB (Railway plugin) or external MongoDB Atlas connection strings
- Redis (Railway plugin)
- RabbitMQ (Railway plugin)

If using Atlas, set each MONGO_URI_* to Atlas URI + db name.

## 3) Service Environment Variables

Set variables per service according to what each service needs.

Common values:
- NODE_ENV=production
- JWT_SECRET=<strong-secret>
- RABBITMQ_URL=<railway-rabbitmq-url>
- REDIS_URL=<railway-redis-url>
- RECAPTCHA_SECRET_KEY=<key>
- TPO_ADMIN_EMAIL=<email>
- MAIL_HOST=smtp.gmail.com
- MAIL_PORT=587
- MAIL_USER=<gmail>
- MAIL_PASS=<gmail-app-password>
- MAIL_FROM=<gmail>
- GEMINI_API_KEY=<gemini-key>
- JUDGE0_API_KEY=<judge0-key>
- JUDGE0_API_HOST=judge0-ce.p.rapidapi.com

Internal URLs for service-to-service calls should use Railway private networking, for example:
- AUTH_SERVICE_URL=http://auth-service.railway.internal:5001
- JOB_SERVICE_URL=http://job-service.railway.internal:5003
- APPLICATION_SERVICE_URL=http://application-service.railway.internal:5004
- NOTIFICATION_SERVICE_URL=http://notification-service.railway.internal:5005
- SUPPORT_SERVICE_URL=http://support-service.railway.internal:5006
- INTERVIEW_SERVICE_URL=http://interview-service.railway.internal:5011

## 4) Deploy API Gateway on Railway

Create another Railway service from this repo:
- Root directory: project root
- Dockerfile path: gateway/Dockerfile

Set these gateway env vars to route traffic:
- AUTH_SERVICE_URL
- JOB_SERVICE_URL
- APPLICATION_SERVICE_URL
- NOTIFICATION_SERVICE_URL
- SUPPORT_SERVICE_URL
- INTERVIEW_SERVICE_URL

Use the private Railway URLs shown in section 3.

After deploy, copy the public URL of this gateway service.

## 5) Deploy Frontend on Vercel

Import this GitHub repo in Vercel.

Project settings:
- Root directory: frontend
- Build command: npm run build
- Output directory: build

Set frontend env vars in Vercel:
- REACT_APP_API_URL=https://<your-gateway-public-domain>/api
- REACT_APP_RECAPTCHA_SITE_KEY=<site-key>

Redeploy after setting env vars.

## 6) Verify End-to-End

Check these URLs:
- https://<gateway-domain>/health
- https://<gateway-domain>/api/auth/health
- https://<gateway-domain>/api/profile/health
- https://<gateway-domain>/api/interview/health

Then open Vercel frontend and test:
- Login/register flow
- Resume links (served through gateway)
- Job application and notifications
- Interview feature (Gemini)

## 7) Common Fixes

- 502 from gateway:
  - Confirm gateway env URLs point to valid Railway internal service URLs and correct ports.
- CORS issues:
  - Ensure frontend uses REACT_APP_API_URL with gateway domain only.
- Email issues:
  - Use Gmail App Password, not normal account password.
- Interview errors:
  - Confirm GEMINI_API_KEY is set on interview-service.
