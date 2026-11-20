import react from '@vitejs/plugin-react'
import { mergeConfig } from 'vitest/config'

import { sharedVitestConfig } from '@proton/vitest-config/shared'

// Specs that read window, document or localStorage run on happy-dom, all the others on node.
// Add a new spec to this list if it fails on node with a ReferenceError.
const domFiles = [
  'lib/Crypto/*.spec.ts',
  'lib/Realtime/WebsocketConnection.spec.ts',
  'lib/Services/CacheService.test.ts',
  'lib/Services/Websockets/WebsocketService.spec.ts',
]

// The projects do not use `extends: true`: it measured 4-6x slower on import (10s vs 1.6s for the node project).
// So they do not inherit the shared test options and must repeat `globals` and `maxWorkers`, and the dom project its environment.
// The react plugin is needed: workspace .tsx sources rely on the automatic JSX runtime.
const shared = {
  plugins: [react()],
  resolve: sharedVitestConfig.resolve,
  test: {
    globals: true,
    maxWorkers: sharedVitestConfig.test?.maxWorkers,
    setupFiles: ['./vitest.setup.ts'],
  },
}

export default mergeConfig(sharedVitestConfig, {
  test: {
    coverage: {
      include: ['lib/**/*.{ts,tsx}'],
    },
    projects: [
      // Logic tests need no DOM: node skips the per-file happy-dom startup.
      mergeConfig(shared, {
        extends: false,
        test: {
          name: 'node',
          environment: 'node',
          include: ['lib/**/*.{test,spec}.{ts,tsx}'],
          exclude: domFiles,
        },
      }),
      mergeConfig(shared, {
        extends: false,
        test: {
          name: 'dom',
          environment: 'happy-dom',
          include: domFiles,
          setupFiles: ['./vitest.setup.ts', './vitest.setup.dom.ts'],
        },
      }),
    ],
  },
})
