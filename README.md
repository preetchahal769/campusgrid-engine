# 🚀 CampusGrid Engine

**CampusGrid Engine** is the high-performance backend core of the CampusGrid ecosystem. Built with NestJS and engineered for scalability, it handles everything from real-time communications to complex academic management and automated student analytics.

---

## 🏗️ Tech Stack

- **Core**: [NestJS](https://nestjs.com/) (Node.js Framework)
- **Database**: [PostgreSQL](https://www.postgresql.org/) with [Prisma ORM](https://www.prisma.io/)
- **Caching & Auth**: [Redis](https://redis.io/) (Refresh token rotation & session management)
- **Object Storage**: [MinIO](https://min.io/) / AWS S3 (Presigned URLs for secure file handling)
- **Validation**: Class-validator & Class-transformer
- **Security**: JWT with sliding sessions and multi-role RBAC

---

## ✨ Key Features

### 🏫 Academic Management
- **Hierarchical Roles**: Super Admin, Admin, Principal, Teacher, Student, Parent, and Staff.
- **Smart Attendance**: Real-time student attendance with integrated leave management.
- **Advanced Assignments**: Multi-file support (PDF, Docs, Images) for both teachers and students.
- **Automated Grading**: Seamless grading flow with background rank recalculation.

### 📢 Communications
- **Global Broadcasts**: Automated school-wide announcements with document attachments.
- **Role-based Targeting**: Specific audience targeting for admins and principals.

### 📊 Analytics & Performance
- **Global Rating System**: Automated student performance tracking based on academic and behavioral metrics.
- **Real-time Leaderboards**: High-speed ranking powered by Redis and SQL aggregations.

### 🔐 Enterprise Security
- **Multi-Tenant Isolation**: Deep school-level data isolation.
- **Secure Storage**: Private file storage with temporary, time-expiring presigned URLs.
- **Session Protection**: Advanced refresh token rotation to prevent session hijacking.

---

## 🛠️ Getting Started

### Prerequisites
- Node.js (v20+)
- Docker (for DB, Redis, and MinIO)
- Bun (optional, but recommended for speed)

### Installation
1. Clone the repository
2. Install dependencies:
   ```bash
   bun install
   ```
3. Set up your environment variables:
   ```bash
   cp .env.example .env
   ```
4. Start the infrastructure:
   ```bash
   docker-compose up -d
   ```
5. Run migrations & seed:
   ```bash
   npx prisma migrate dev
   npx prisma db seed
   ```

### Running Locally
```bash
bun run start:dev
```

---

## 📖 Documentation
Detailed frontend integration guides are available in the `/docs` directory:
- [Frontend Integration V2 (Latest)](./docs/frontend_integration_v2.md)
- [Teacher API Guide](./docs/api_teacher.md)
- [Student API Guide](./docs/api_student.md)
- [Principal API Guide](./docs/api_principal.md)

---

## ⚖️ License
Internal Project - CampusGrid © 2026
