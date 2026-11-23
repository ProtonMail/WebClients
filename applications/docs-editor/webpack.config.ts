import { DefinePlugin, type Configuration } from 'webpack'
import { config as dotenvConfig } from 'dotenv'
import path from 'node:path'

import { type WebpackEnvArguments, getWebpackOptions } from '@proton/pack/lib/config'
import { addDevEntry, getConfig } from '@proton/pack/webpack.config'

import appConfig from './appConfig'

dotenvConfig({ path: path.join(__dirname, '.env') })

const result = (opts: WebpackEnvArguments): Configuration => {
  const webpackOptions = getWebpackOptions(opts, { appConfig })
  // The dev server's type checker takes about 1-2 GB per app. Environments that type check on their own, like
  // agent sandboxes running several dev servers, turn it off with DOCS_DEV_SKIP_TYPECHECK=true.
  if (process.env.DOCS_DEV_SKIP_TYPECHECK === 'true') {
    webpackOptions.errorLogs = false
    webpackOptions.warningLogs = false
  }
  const config = getConfig(webpackOptions)

  // Keep dependencies such as Jotai on the editor's React runtime, including JSX and renderer subpaths.
  config.resolve = {
    ...config.resolve,
    alias: {
      ...config.resolve?.alias,
      react: path.dirname(require.resolve('react/package.json', { paths: [__dirname] })),
      'react-dom': path.dirname(require.resolve('react-dom/package.json', { paths: [__dirname] })),
    },
  }

  // @proton-docs/docs-editor is an ES module that imports `lodash/debounce` without an extension, which
  // webpack resolves in ES modules only when told not to require fully specified paths.
  config.module?.rules?.push({
    test: /\.js$/,
    include: /[\\/]node_modules[\\/]@proton-docs[\\/]docs-editor[\\/]/,
    resolve: { fullySpecified: false },
  })

  config.plugins?.push(
    new DefinePlugin({
      'process.env.DOCS_SHEETS_KEY': JSON.stringify(process.env.DOCS_SHEETS_KEY),
    }),
  )
  if (webpackOptions.appMode === 'standalone') {
    addDevEntry(config)
  }
  // @ts-ignore
  const scssRule = config.module.rules.find((rule) => rule.test.toString().includes('scss'))
  // @ts-ignore
  const postCssLoader = scssRule.use.find((use) => use.loader.includes('postcss-loader'))
  // @ts-ignore
  postCssLoader.options.postcssOptions.plugins.push(require('tailwindcss')())
  return config
}

export default result
