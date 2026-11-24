import * as matchers from '@testing-library/jest-dom/matchers';
// Setup shared by the workspaces: add `import '@proton/vitest-config/setup';` to a vitest.setup.ts.
// It uses the global `expect` (globals: true), not an import from 'vitest': this file can resolve a different
// copy of vitest than the runner, and the matchers would then land on the wrong `expect`.
import type {} from '@testing-library/jest-dom/vitest';

// DOM matchers (toBeInTheDocument, toHaveTextContent, …). The `import type` above only loads their typings.
expect.extend(matchers);
