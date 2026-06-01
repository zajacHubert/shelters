# Donor Reachability Integration Testing

This document covers local execution for phase 1 donor integration harness checks.

## Prerequisites

- Bun installed and available in PATH.
- Dependencies installed (`npm install`).
- Repository root as current directory.

## Run Donor Integration Scaffold

```bash
bun test tests/integration/donor-flow --bail
```

This command validates:

- donor harness helpers compile and execute,
- fixture contract exports are stable,
- scaffold assertions for status and response markers work.

## Additional Validation

```bash
npm run lint
```

Lint should remain green after adding phase 1 files.

## Expected Environment Variables

No special environment variables are required for phase 1 scaffold tests.

## Failure Diagnostics

- `Expected HTTP ... received ...` indicates contract mismatch in mock result assertions.
- `Expected marker not found: ...` indicates response-body marker assertion mismatch.
- `Cannot find module .../support/*` indicates path or directory structure drift in the donor test harness.
