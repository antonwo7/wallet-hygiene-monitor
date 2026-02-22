# Tests (Unit)

This folder contains **unit tests only** for the Wallet Hygiene Monitor backend.

## How to run (expected setup)
These tests are written for **Jest + ts-jest** (TypeScript).

Install dev deps (example):

- `jest`
- `ts-jest`
- `@types/jest`

Then run:

```bash
npx jest -c tests/jest.config.cjs
```

> Note: the current backend archive did not include Jest deps/scripts, so add them to `devDependencies` in your repo.
