import react from '@vitejs/plugin-react'
import { createRequire } from 'module'
import { fileURLToPath } from 'url'
import { mergeConfig } from 'vitest/config'

import { sharedVitestConfig } from '@proton/vitest-config/shared'

const require = createRequire(import.meta.url)
const appDir = fileURLToPath(new URL('./src/app', import.meta.url))

const fileMock = require.resolve('@proton/components/__mocks__/fileMock.js')
const styleMock = require.resolve('@proton/components/__mocks__/styleMock.js')

// `.test.ts` specs run on node, `.test.tsx` and the specs listed here on happy-dom.
// Add a spec to this list if it fails on node with a ReferenceError (window, document...).
const domFiles = [
  'src/app/utils/docs-url-bar.test.ts',
  'src/app/utils/flags.test.ts',
  'src/app/routes/**/doc2/__utils/{ClientEditorBridge,debugDownloads,signRealtimeDocumentUpdate,documentFileActions,downloadExport,fetchExternalImageAsBase64,loadDocument,resolveOpenAction}.test.ts',
  'src/app/components/document/public/utils.test.ts',
  // Hook specs that render with Testing Library or read window
  'src/app/**/{useDriveSharing,useSyncCanOrganizeToEditor,useDocsBookmarks,useChangeAddressWhenPubliclyShared,useRowSelection,useUnloadGuardedApi,useDoubleClick,useIsNarrow,useIsDarkThemeMode,useHomepageLocalization}.test.ts',
]

// The projects do not use `extends: true`: it measured 4-6x slower on import (see docs-core).
const shared = {
  plugins: [react()],
  resolve: {
    ...sharedVitestConfig.resolve,
    alias: [
      { find: /^.*\.(jpg|jpeg|png|gif|eot|otf|webp|svg|ttf|woff|woff2|mp4|webm|md)$/, replacement: fileMock },
      { find: /^.*\.(css|scss|less)$/, replacement: styleMock },
      { find: /^~\/components\/(.*)$/, replacement: `${appDir}/components/$1` },
      { find: /^~\/drive-sdk\/(.*)$/, replacement: `${appDir}/drive-sdk/$1` },
      { find: /^~\/utils\/(.*)$/, replacement: `${appDir}/utils/$1` },
      { find: /^~\/redux-store\/(.*)$/, replacement: `${appDir}/redux-store/$1` },
      { find: /^~\/homepage$/, replacement: `${appDir}/homepage` },
      { find: /^~\/config$/, replacement: `${appDir}/config` },
    ],
  },
  test: {
    globals: true,
    // CI runs several test tasks at once on an 8GB pod. Measured with CI=1 (jest --runInBand: 40s,
    // 1.4GB): 4 workers 15s 1.9GB, 2 workers 29s 1.1GB, 1 worker 56s 0.8GB.
    maxWorkers: process.env.CI ? 2 : undefined,
    setupFiles: ['./vitest.setup.ts'],
    server: { deps: { inline: [/@protontech\/crypto/] } },
  },
}

export default mergeConfig(sharedVitestConfig, {
  test: {
    coverage: {
      include: ['src/**/*.{ts,tsx}'],
      exclude: ['src/app/locales.ts'],
    },
    projects: [
      mergeConfig(shared, {
        extends: false,
        test: {
          name: 'node',
          environment: 'node',
          include: ['src/**/*.test.ts'],
          exclude: domFiles,
        },
      }),
      mergeConfig(shared, {
        extends: false,
        test: {
          name: 'dom',
          environment: 'happy-dom',
          environmentOptions: { happyDOM: { url: 'http://localhost/' } },
          include: ['src/**/*.test.tsx', ...domFiles],
          setupFiles: ['./vitest.setup.ts', './vitest.setup.dom.ts'],
        },
      }),
    ],
  },
})
