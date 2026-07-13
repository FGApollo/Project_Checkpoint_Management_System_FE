# Checkpoint Management System Frontend

## Backend configuration

The frontend uses `https://swd-capstone.onrender.com` for REST API and SignalR
connections by default. To use another backend, copy `.env.example` to
`.env.local`, update the `VITE_*` values, and restart the Vite development
server.

```powershell
Copy-Item .env.example .env.local
npm run dev
```

Never store secrets in `VITE_*` variables because Vite exposes them to the
browser bundle.

The verified review workflow, API contracts, and known backend gaps are
documented in [`docs/api-review-workflow.md`](docs/api-review-workflow.md).

The review workflow includes domain and persistence-contract tests. Run the
same checks used before production handoff with:

```powershell
npm test
npm run lint
npm run build
```

Student availability uses the backend's transactional
`PUT /student-review/slots` contract with `{ roundId, slots }`. The client reads
the slot grid back after saving and reports success only when all five selected
slots match the persisted `myAvailability` response.

## Development

This template provides a minimal setup to get React working in Vite with HMR and some Oxlint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the Oxlint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and Oxlint's TypeScript related rules in your project.
