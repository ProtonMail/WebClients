import { mergeConfig } from 'vitest/config'

import { sharedVitestConfig } from '@proton/vitest-config/shared'

export default mergeConfig(sharedVitestConfig, {
  test: {
    clearMocks: true,
    coverage: {
      include: ['lib/**/*.{ts,tsx}'],
    },
  },
})
