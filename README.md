# Resume Shortlister

A production-ready full-stack web application for recruiters to efficiently shortlist candidates based on key criteria: years of experience, technical skills, location/remote preference, notice period, and salary expectations.

## 🚀 Quick Start

### Prerequisites
- **Docker** & **Docker Compose** (recommended)
- **Java 25 (LTS)** + **Maven 3.9+** (for local backend development)
- **Node.js 20+** + **npm** (for local frontend development)

### One-Command Deployment (Docker)
```bash
# Clone and navigate
cd resume-shortlister

# Copy environment template
cp .env.example .env

# Start all services
docker-compose up -d

# Access the application
# Frontend: http://localhost:5173
# Backend API: http://localhost:8080/api
# Swagger UI: http://localhost:8080/api/swagger-ui.html
# Database: localhost:5432 (postgres/postgres)
```

### Local Development

#### Backend (Spring Boot)
```bash
cd backend
cp ../.env.example .env
# Edit .env with your settings
mvn spring-boot:run
```

#### Frontend (React + Vite)
```bash
cd frontend
npm install
npm run dev
```

## 🏗️ Architecture

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   Frontend      │────▶│    Backend      │────▶│   Database      │
│   (React 18)    │     │  (Spring Boot 3)│     │  (PostgreSQL 16)│
│   Port: 5173    │     │   Port: 8080    │     │   Port: 5432    │
└─────────────────┘     └─────────────────┘     └─────────────────┘
                              │
                              ▼
                      ┌─────────────────┐
                      │   Redis Cache   │
                      │  (Optional)     │
                      └─────────────────┘
```

### Tech Stack

| Layer | Technology | Version |
|-------|------------|---------|
| **Frontend** | React + TypeScript + Vite | 18 / 5 / 5 |
| **Styling** | Tailwind CSS | 3.4 |
| **State/Forms** | React Hook Form + Zod | 7 / 3 |
| **Backend** | Spring Boot + Spring Data JPA | 3.2 |
| **Security** | Spring Security + JWT (JJWT) | 6 / 0.12 |
| **Database** | PostgreSQL + Flyway | 16 / 10 |
| **Build** | Maven + npm | 3.9 / 10 |
| **Container** | Docker + Docker Compose | 24 / 2.24 |
| **CI/CD** | GitHub Actions | - |

## 📋 Core Features

### Candidate Submission (Public)
- **Public application form** at `/apply` - no authentication required
- Collects all 5 shortlisting criteria + contact info & links
- Real-time skill suggestions with autocomplete
- Responsive design works on mobile & desktop

### Recruiter Dashboard (Authenticated)
- **JWT-based authentication** with register/login
- **Role-based access** (RECRUITER, ADMIN)
- **Statistics overview** - counts by status
- **Recent applications** quick view

### Candidate Management
- **Advanced filtering** by all 5 criteria:
  - Years of experience (min/max)
  - Technical skills (comma-separated, matches any)
  - Location (partial match)
  - Remote preference (On-site/Hybrid/Remote)
  - Notice period (exact match)
  - Maximum salary expectation
  - Status filter
- **Pagination & sorting** (server-side)
- **CSV export** of filtered results
- **Status workflow**: NEW → SHORTLISTED → CONTACTED → INTERVIEWING → HIRED/REJECTED
- **Recruiter notes** per candidate
- **Detail modal** with full candidate profile

## 🔐 API Endpoints

### Public
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/candidates` | Submit candidate application |

### Authenticated (Recruiter)
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register recruiter |
| POST | `/api/auth/login` | Login & get JWT |
| GET | `/api/candidates` | List with filters & pagination |
| GET | `/api/candidates/{id}` | Get candidate details |
| GET | `/api/candidates/status/{status}` | Get by status |
| PATCH | `/api/candidates/{id}/status` | Update status + notes |
| DELETE | `/api/candidates/{id}` | Delete (ADMIN only) |
| GET | `/api/candidates/stats/count-by-status` | Dashboard stats |

## 🐳 Docker Deployment

### Production Build
```bash
# Build images
docker-compose build

# Run in background
docker-compose up -d

# View logs
docker-compose logs -f

# Stop
docker-compose down
```

### Environment Variables
| Variable | Description | Default |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL JDBC URL | `jdbc:postgresql://postgres:5432/resume_shortlister` |
| `DATABASE_USER` | DB username | `postgres` |
| `DATABASE_PASSWORD` | DB password | `postgres` |
| `JWT_SECRET` | Base64-encoded JWT secret | (generate with `openssl rand -base64 64`) |
| `JWT_EXPIRATION_MS` | Token expiry | `86400000` (24h) |
| `CORS_ALLOWED_ORIGINS` | Allowed CORS origins | `http://localhost:5173` |
| `VITE_API_URL` | Frontend API base URL | `/api` |

### Health Checks
- **Backend**: `GET /api/actuator/health`
- **Frontend**: `GET /health`
- **Database**: `pg_isready`

## 🧪 Testing

```bash
# Backend tests
cd backend && mvn test

# Frontend tests
cd frontend && npm test

# E2E (requires running services)
cd frontend && npm run test:e2e
```

## 📁 Project Structure

```
resume-shortlister/
├── backend/                    # Spring Boot application
│   ├── src/main/java/.../
│   │   ├── controller/         # REST controllers
│   │   ├── service/            # Business logic
│   │   ├── repository/         # Data access
│   │   ├── domain/             # JPA entities
│   │   ├── dto/                # Request/Response DTOs
│   │   ├── mapper/             # MapStruct mappers
│   │   ├── security/           # JWT, Security config
│   │   └── ResumeShortlisterApplication.java
│   ├── src/main/resources/
│   │   ├── application.yml     # Config
│   │   └── db/migration/       # Flyway migrations
│   ├── pom.xml
│   └── Dockerfile
├── frontend/                   # React + Vite application
│   ├── src/
│   │   ├── components/         # Reusable UI components
│   │   ├── context/            # React context (Auth)
│   │   ├── layouts/            # Page layouts
│   │   ├── lib/                # Utilities (API, helpers)
│   │   ├── pages/              # Page components
│   │   ├── App.tsx             # Routes
│   │   └── main.tsx            # Entry point
│   ├── index.html
│   ├── package.json
│   ├── vite.config.ts
│   ├── tailwind.config.js
│   ├── nginx.conf
│   └── Dockerfile
├── .github/workflows/          # CI/CD pipelines
├── docker-compose.yml          # Local orchestration
├── .env.example                # Environment template
├── .gitignore
└── README.md
```

## 🔧 Configuration

### Database Migrations (Flyway)
Migrations run automatically on startup. Files in `backend/src/main/resources/db/migration/`:
- `V1__create_initial_schema.sql` - Initial tables, indexes, triggers

### Adding New Migrations
```sql
-- V2__add_new_column.sql
ALTER TABLE candidates ADD COLUMN new_field VARCHAR(100);
```

### JWT Secret Generation
```bash
# Generate secure secret
openssl rand -base64 64
# Add to .env as JWT_SECRET
```

## 🚀 CI/CD Pipeline

The GitHub Actions workflow (`.github/workflows/ci-cd.yml`) runs on every push/PR:

1. **Backend Tests** - Maven test with Testcontainers PostgreSQL
2. **Frontend Tests** - Vitest + React Testing Library + ESLint
3. **Docker Build** - Multi-stage builds pushed to GHCR
4. **Deploy Staging** - Auto-deploy on `develop` branch
5. **Deploy Production** - Manual approval on `main` branch

### Required Secrets
- `GITHUB_TOKEN` (auto-provided)
- Add deployment-specific secrets in repository settings

## 📊 Monitoring

### Actuator Endpoints (Backend)
- `/api/actuator/health` - Health check
- `/api/actuator/metrics` - Application metrics
- `/api/actuator/prometheus` - Prometheus format

### Logging
- Structured JSON logs in production
- Console pretty-print in development
- Levels configurable via `logging.level.*`

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

## 📝 License

MIT License - see [LICENSE](LICENSE) for details.

## 🙏 Acknowledgments

- Spring Boot team for the excellent framework
- React & Vite teams for the modern frontend tooling
- Tailwind CSS for the utility-first styling
- All open-source contributors

---

**Built with ❤️ for recruiters everywhere**