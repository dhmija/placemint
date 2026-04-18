# Support Service - Consolidated Microservice

This is a consolidated Express.js microservice that combines 5 previously separate services:

1. **Announcements** (formerly `announcement-service` on port 5008)
2. **Hackathons** (formerly `hackathon-service` on port 5009)
3. **Tasks** (formerly `task-service` on port 5010)
4. **Skills** (formerly `skills-service` on port 5006)
5. **Messaging** (formerly `messaging-service` on port 5012)

## Architecture

### Modular Organization
Each service is organized in its own module under `modules/`:
```
modules/
├── announcements/
│   ├── controllers/
│   ├── models/
│   └── routes/
├── hackathons/
│   ├── controllers/
│   ├── models/
│   └── routes/
├── tasks/
│   ├── controllers/
│   ├── models/
│   └── routes/
├── messaging/
│   ├── controllers/
│   ├── models/
│   └── routes/
└── skills/
    ├── controllers/
    └── routes/
```

### Separate Database Connections
Each service maintains its own MongoDB connection using `mongoose.createConnection()`. This ensures:
- **Data isolation** between modules
- **Independent scalability** of database operations per module
- **Backward compatibility** with existing data structures

Database connections:
- `announcementDB` → announcements collection
- `hackathonDB` → hackathons & hackathonRegistrations collections
- `taskDB` → tasks & taskSubmissions collections
- `messagingDB` → conversations & messages collections
- Skills is stateless (no DB required)

### Route Mounting
Routes are mounted under `/api/` prefix at the gateway:
- `/api/announcements` → Announcements CRUD
- `/api/hackathons` → Hackathon listings and registrations
- `/api/tasks` → Task and submission management with Judge0 integration
- `/api/skills` → Skills categorization (stateless)
- `/api/messaging` → Conversations and messaging

## Configuration

### Environment Variables (`.env`)
```bash
PORT=5006
NODE_ENV=production
MONGO_URI=mongodb://mongo:27017/placemint
AUTH_SERVICE_URL=http://auth-service:5000
JUDGE0_API_HOST=judge0-ce.p.rapidapi.com
JUDGE0_API_KEY=your_api_key_here
```

See `.env.example` for all available options.

## Running the Service

### Development
```bash
npm install
npm run dev
```

### Production
```bash
npm install
npm start
```

### Docker
```bash
docker build -t support-service:latest .
docker run -p 5006:5006 --env-file .env support-service:latest
```

## API Endpoints

### Announcements
- `GET /announcements` - Get all announcements
- `POST /announcements` - Create announcement (TPO only)
- `PUT /announcements/:id` - Update announcement (TPO only)
- `DELETE /announcements/:id` - Delete announcement (TPO only)

### Hackathons
- `GET /hackathons` - Get all hackathons
- `GET /hackathons/active` - Get active hackathons only
- `GET /hackathons/:id` - Get hackathon by ID
- `POST /hackathons` - Create hackathon (TPO only)
- `PUT /hackathons/:id` - Update hackathon (TPO only)
- `DELETE /hackathons/:id` - Delete hackathon (TPO only)

### Tasks
- `POST /tasks` - Create/update task (recruiter/TPO)
- `GET /tasks/job/:jobId` - Get task for a job (student view)
- `POST /tasks/job/:jobId/submit` - Submit task solution
- `GET /tasks/job/:jobId/results` - Get scoreboard
- `GET /tasks/job/:jobId/my-result` - Get student's result
- `GET /tasks/job/:jobId/student/:studentId` - Get specific student's result

### Skills
- `GET /skills` - Get all skills (with optional search parameter)

### Messaging
- `POST /messaging/conversations/start` - Start new conversation
- `GET /messaging/conversations/me` - Get user's conversations
- `GET /messaging/conversations/:id` - Get conversation by ID
- `POST /messaging/messages` - Send message
- `GET /messaging/messages/:id` - Get messages in conversation
- `PUT /messaging/messages/:id/read` - Mark messages as read

## Gateway Configuration

The Nginx API Gateway routes the following to `support-service`:
- `/api/announcements/*` → `${SUPPORT_SERVICE_URL}/announcements`
- `/api/hackathons/*` → `${SUPPORT_SERVICE_URL}/hackathons`
- `/api/tasks/*` → `${SUPPORT_SERVICE_URL}/tasks`
- `/api/skills/*` → `${SUPPORT_SERVICE_URL}/skills`
- `/api/messaging/*` → `${SUPPORT_SERVICE_URL}/messaging`

Update your `docker-compose.yml` to set:
```yaml
environment:
  SUPPORT_SERVICE_URL: http://support-service:5006
```

## Design Decisions

### Why Separate Connections?
Even though services share the same MongoDB instance, separate connections per module provide:
1. **Future scalability** - Each module can eventually move to its own database
2. **Operational safety** - Issues in one module's connection don't cascade
3. **Logical separation** - Clear data ownership and concerns

### Factory Pattern Controllers
Controllers are now factory functions that receive their dependencies (models, logger) as parameters:
```javascript
const controller = require('./controller')(Model, logger);
```

This enables:
- Easier testing (inject mock models/logger)
- Dependency clarity
- No global state

### Route Organization
Each route module is now a factory that receives its controller and auth middleware:
```javascript
const routes = require('./routes')(controller, { protect, checkRole });
```

## Migration from Individual Services

If you need to keep the individual services running in parallel for a gradual migration:
1. Deploy `support-service` alongside existing services
2. Update gateway to route through new service for specific endpoints
3. Gradually migrate clients to new consolidated routes
4. Once all clients are migrated, remove individual services

## Troubleshooting

### Database connection errors
- Verify `MONGO_URI` is correctly set
- Check MongoDB is running and accessible
- Review logs in `logs/` directory

### Judge0 integration failures
- Verify `JUDGE0_API_HOST` and `JUDGE0_API_KEY` are set
- Check Judge0 API service is accessible
- Test with curl: `curl -X GET "https://{JUDGE0_API_HOST}/api/languages"`

### Authentication errors
- Ensure `AUTH_SERVICE_URL` is set correctly
- Verify auth service is running
- Check token validation response format

## Future Enhancements

- [ ] Extract shared utilities into a common module
- [ ] Implement caching layer for skills
- [ ] Add real-time messaging with WebSockets
- [ ] Implement comprehensive logging and monitoring
- [ ] Add API rate limiting per module
