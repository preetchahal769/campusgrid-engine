# Build Specification Skill: Multi-Stage Container Compiles

This skill enforces strict multi-stage Docker targeting across all testing, staging, and production environments to guarantee zero dependency leakage.

---

## 🛠️ Multi-Stage Specifications

### 1. `testing-env` (Target Stage)
* **Goal**: Optimized for development cycles, unit/integration tests, and hot-reload.
* **Directives**:
  * Include all `devDependencies` (linters, test frameworks, bundlers).
  * Enable TypeScript source maps and debug bindings.
  * Inject local mock database configurations and logging verbs.

### 2. `staging-env` (Target Stage)
* **Goal**: Mirror production behavior but run on pre-production infrastructure.
* **Directives**:
  * Execute a full production build compile (`npm run build`).
  * Remove active devDependencies, retaining only production node modules.
  * Point connection strings to the staging/QA database cluster and telemetry endpoints.

### 3. `production-env` (Target Stage)
* **Goal**: Ultra-slim runtime executing pure, optimized artifacts.
* **Directives**:
  * Standardize runtime on a minimal `node:20-alpine` base (~80MB).
  * Exclude any package managers, build cache, or TypeScript compilers.
  * Strip all devDependencies.
  * Launch directly via `node dist/main.js` under non-privileged security contexts.
