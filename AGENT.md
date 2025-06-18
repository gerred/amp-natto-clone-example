# Agent Instructions for Node Flow

## Build/Test Commands
- **Install**: `pnpm install`
- **Development**: `pnpm dev` (starts demo app on http://localhost:5173)
- **Build**: `pnpm build` (builds all packages)
- **Test**: `pnpm test` (runs Vitest unit tests)
- **E2E Test**: `pnpm test:e2e` (runs Playwright e2e tests)
- **Lint**: `pnpm lint` (runs Biome linting)
- **Format**: `pnpm format` (runs Biome formatting)
- **Typecheck**: `pnpm typecheck` (runs TypeScript checking on all packages)

## Architecture Overview
Node Flow is a node-based code execution platform combining visual workflows with real-time widgets and AI agent integration.

**Project Structure**:
- `research/` - Technical research and analysis documents
- `specs/` - Complete technical specifications (architecture, node-system, live-widgets, execution-engine, agent-integration, user-interface)
- Early development stage - core implementation not yet built

**Planned Architecture**:
- Frontend: Custom WebGL canvas + React widgets + Redux state
- Backend: Node.js/TypeScript runtime + PostgreSQL + Redis + Kafka
- Infrastructure: Docker + Kubernetes + GraphQL API

## Development Guidelines
- **Language**: TypeScript (CommonJS modules currently)
- **Target**: Node.js 18+, TypeScript 5+
- **Approach**: Agent-first design - AI agents are primary users
- **Focus**: Real-time interactivity with live widget updates
- **Style**: Follow existing specifications in `/specs/` directory
- **Documentation**: Comprehensive specs available - reference before implementation
