import react from '@vitejs/plugin-react'
import { readFileSync } from 'node:fs'
import path from 'node:path'
import tailwindcss from 'tailwindcss'
import { type Plugin, defineConfig } from 'vite'

/**
 * Dev-only server for the Docs client that needs far less memory than `pnpm start` (webpack). Run it with
 * `pnpm start:lite`. It is never used to build: production bundles still come from `build:web`.
 */

const appDir = import.meta.dirname

const readJson = (file: string) => JSON.parse(readFileSync(path.join(appDir, file), 'utf8'))

// What @proton/pack defines for the webpack dev server (packages/pack/lib/config.ts and webpack/plugins.js).
const protonConfig = {
  API_URL: '/api',
  APP_NAME: readJson('package.json').name,
  APP_VERSION: '5.0.999.999',
  BRANCH: '',
  CLIENT_SECRET: '',
  CLIENT_TYPE: 1,
  COMMIT: '',
  DATE_VERSION: new Date().toUTCString(),
  LOCALES: readJson('locales/config/locales.json'),
  LOGICAL_SCSS: false,
  SENTRY_DESKTOP_DSN: '',
  SENTRY_DSN: '',
  SSO_URL: '',
  VERSION_PATH: '/assets/version.json',
}

// Stylesheets that webpack loads as strings instead of injecting them (packages/pack/webpack/css.loader.js).
const STYLESHEET_AS_STRING = /\.theme\.css$|\.raw\.scss$/

// src/app.ejs without the favicons and meta tags. The client reads its config from #configData.
const INDEX_HTML = `<!doctype html>
<html lang="en-US">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <base href="/" />
    <title>Proton Docs</title>
    <script id="configData" type="application/json">${JSON.stringify(protonConfig)}</script>
  </head>
  <body>
    <div class="app-root"></div>
    <div class="app-root-loader"></div>
    <script type="module" src="/src/app/index.tsx"></script>
  </body>
</html>`

const protonWebpackCompat = (): Plugin => ({
  name: 'proton-webpack-compat',
  enforce: 'pre',
  async resolveId(source, importer, options) {
    if (source.includes('?')) {
      return null
    }
    const query = STYLESHEET_AS_STRING.test(source) ? 'inline' : source.endsWith('.md') ? 'raw' : undefined
    if (!query) {
      return null
    }
    const resolved = await this.resolve(source, importer, { ...options, skipSelf: true })
    return resolved && `${resolved.id}?${query}`
  },
  configureServer(server) {
    // The health check of local-sso's HAProxy (utilities/local-sso/local.cfg).
    server.middlewares.use('/__ready', (_req, res) => {
      res.end('ok')
    })
    // The page has no index.html on disk (webpack renders src/app.ejs): serve it for every navigation.
    return () => {
      server.middlewares.use(async (req, res, next) => {
        if (req.method !== 'GET' || !req.headers.accept?.includes('text/html')) {
          next()
          return
        }
        res.setHeader('Content-Type', 'text/html')
        res.end(await server.transformIndexHtml(req.url ?? '/', INDEX_HTML))
      })
    }
  },
})

const appAlias = (name: string, target: string) => ({ find: name, replacement: path.join(appDir, target) })

export default defineConfig({
  root: appDir,
  appType: 'custom',
  plugins: [protonWebpackCompat(), react()],
  define: {
    ...Object.fromEntries(
      Object.entries(protonConfig).map(([key, value]) => [`process.env.${key}`, JSON.stringify(value)]),
    ),
    // What `pnpm start-all` (local-sso) passes to `pnpm start`.
    WEBPACK_APP_MODE: JSON.stringify('sso'),
    WEBPACK_PUBLIC_PATH: JSON.stringify('/'),
    WEBPACK_FEATURE_FLAGS: JSON.stringify(''),
    global: 'globalThis',
    // webpack's HMR API, which Vite doesn't have: the code that uses it checks for it first.
    'module.hot': 'undefined',
  },
  resolve: {
    alias: [
      // Sass imports use webpack's `~` prefix for packages.
      { find: /^~(?!\/)(.+)/, replacement: '$1' },
      // The import aliases of webpack.config.ts.
      appAlias('~/components', 'src/app/components'),
      appAlias('~/drive-sdk', 'src/app/drive-sdk'),
      appAlias('~/utils', 'src/app/utils'),
      appAlias('~/redux-store', 'src/app/redux-store'),
      appAlias('~/homepage', 'src/app/homepage'),
      appAlias('~/config', 'src/app/config'),
    ],
    dedupe: ['react', 'react-dom'],
  },
  optimizeDeps: {
    entries: ['src/app/index.tsx'],
    // Its crypto worker is created with `new URL('../worker.ts', import.meta.url)`, which only resolves from source.
    exclude: ['@protontech/crypto'],
  },
  css: {
    postcss: { plugins: [tailwindcss(path.join(appDir, 'tailwind.config.js'))] },
    preprocessorOptions: { scss: { quietDeps: true, silenceDeprecations: ['import', 'global-builtin'] } },
  },
  server: {
    host: true,
    port: 8087,
    strictPort: true,
    // Vite always allows localhost and IP addresses; local-sso sends docs.proton.dev.
    allowedHosts: ['.proton.dev'],
  },
})
