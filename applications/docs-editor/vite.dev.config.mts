import react from '@vitejs/plugin-react'
import { config as dotenvConfig } from 'dotenv'
import { readFileSync } from 'node:fs'
import path from 'node:path'
import tailwindcss from 'tailwindcss'
import { type Plugin, defineConfig } from 'vite'

/**
 * Dev-only server for the editor that needs far less memory than `pnpm start` (webpack). Run it with
 * `pnpm start:lite`. It is never used to build: production bundles still come from `build:web`. See the README for
 * how it differs from the webpack dev server.
 */

const appDir = import.meta.dirname

dotenvConfig({ path: path.join(appDir, '.env'), quiet: true })

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

const INDEX_HTML = `<!doctype html>
<html lang="en-US" class="feature-scrollbars-off">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <base href="/" />
    <title>Proton Docs</title>
  </head>
  <body>
    <div class="app-root"></div>
    <style id="theme-root"></style>
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

export default defineConfig({
  root: appDir,
  appType: 'custom',
  plugins: [protonWebpackCompat(), react()],
  define: {
    ...Object.fromEntries(
      Object.entries(protonConfig).map(([key, value]) => [`process.env.${key}`, JSON.stringify(value)]),
    ),
    'process.env.DOCS_SHEETS_KEY': JSON.stringify(process.env.DOCS_SHEETS_KEY),
    // What `pnpm start-all` (local-sso) passes to `pnpm start`, which overrides the script's own `--appMode=standalone`.
    WEBPACK_APP_MODE: JSON.stringify('sso'),
    WEBPACK_PUBLIC_PATH: JSON.stringify('/'),
    WEBPACK_FEATURE_FLAGS: JSON.stringify(''),
    global: 'globalThis',
  },
  resolve: {
    // Sass imports use webpack's `~` prefix for packages.
    alias: [{ find: /^~(.+)/, replacement: '$1' }],
    // Keeps dependencies such as Jotai on the editor's React, like webpack.config.ts.
    dedupe: ['react', 'react-dom'],
  },
  // `start:lite` pre-bundles the dependencies in a `vite optimize` process of its own, before the server starts: the
  // bundler holds on to about 1.5 GB of native memory after pre-bundling, which goes away with that process.
  optimizeDeps: { entries: ['src/app/index.tsx'] },
  css: {
    postcss: { plugins: [tailwindcss(path.join(appDir, 'tailwind.config.js'))] },
    preprocessorOptions: { scss: { quietDeps: true, silenceDeprecations: ['import', 'global-builtin'] } },
  },
  server: {
    // All addresses, like the webpack dev server: local-sso's HAProxy reaches it as `localhost`, which can resolve to
    // IPv4 or IPv6.
    host: true,
    port: 8088,
    strictPort: true,
    // Vite always allows localhost and IP addresses; local-sso sends docs-editor.proton.dev. Anything else could be DNS
    // rebinding.
    allowedHosts: ['.proton.dev'],
  },
})
