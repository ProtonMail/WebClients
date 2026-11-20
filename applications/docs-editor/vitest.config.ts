import react from '@vitejs/plugin-react'
import { createRequire } from 'module'
import path from 'path'
import { mergeConfig } from 'vitest/config'

import { sharedVitestConfig } from '@proton/vitest-config/shared'

const require = createRequire(import.meta.url)

// Absolute paths: the aliased imports also come from workspace packages that do not depend on @proton/components
const fileMock = require.resolve('@proton/components/__mocks__/fileMock.js')
const styleMock = require.resolve('@proton/components/__mocks__/styleMock.js')
const mocks = path.resolve(__dirname, 'src/__mocks__')

export default mergeConfig(sharedVitestConfig, {
  plugins: [react()],
  resolve: {
    alias: [
      // Before the generic stylesheet mock: tests mock each editor's stylesheet to check which one loads.
      { find: /^@proton-docs\/docs-editor\/style\.css$/, replacement: path.join(mocks, 'docsEditorStyleMock.js') },
      { find: /^@proton-docs\/sheets-editor\/style\.css$/, replacement: path.join(mocks, 'sheetsEditorStyleMock.js') },
      { find: /^.*\.(jpg|jpeg|png|gif|eot|otf|webp|svg|ttf|woff|woff2|mp4|webm|md)$/, replacement: fileMock },
      { find: /^.*\.(css|scss|less)$/, replacement: styleMock },
    ],
  },
  test: {
    server: { deps: { inline: ['@protontech/crypto', '@proton-docs/docs-editor'] } },
    environmentOptions: { happyDOM: { url: 'http://localhost/' } },
    setupFiles: ['./vitest.setup.ts'],
    coverage: { exclude: ['src/app/locales.ts'] },
  },
})
