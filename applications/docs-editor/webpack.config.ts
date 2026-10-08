import { DefinePlugin, type Configuration } from 'webpack'
import { config as dotenvConfig } from 'dotenv'
import path from 'node:path'

import { type WebpackEnvArguments, getWebpackOptions } from '@proton/pack/lib/config'
import { addDevEntry, getConfig } from '@proton/pack/webpack.config'

import appConfig from './appConfig'

const isStandaloneSheet = process.env.STANDALONE_SHEET === 'true'
const isStandaloneDoc = process.env.STANDALONE_DOC === 'true'
if (isStandaloneSheet && isStandaloneDoc) {
  throw new Error('STANDALONE_SHEET and STANDALONE_DOC cannot both be enabled')
}
const isStandaloneEditor = isStandaloneSheet || isStandaloneDoc
if (!isStandaloneEditor) {
  dotenvConfig({ path: path.join(__dirname, '.env') })
}

const result = (opts: WebpackEnvArguments): Configuration => {
  const webpackOptions = getWebpackOptions(opts, { appConfig })
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

  if (isStandaloneEditor) {
    const standaloneEntry = isStandaloneDoc ? 'standalone-doc' : 'standalone-sheet'
    config.entry = { index: [path.resolve(__dirname, `src/${standaloneEntry}/index.tsx`)] }
    if (config.devServer) {
      config.devServer.host = '127.0.0.1'
      config.devServer.allowedHosts = ['localhost', '127.0.0.1']
      config.devServer.proxy = undefined
    }
  }

  config.watchOptions = {
    ...config.watchOptions,
    // Rows n Columns packages are vendored as built files, so their dist directories must remain watchable.
    ignored:
      /^(?!.*\/vendor\/rowsncolumns\/).*\/dist(?:\/|$)|\/node_modules(?:\/|$)|\/locales(?:\/|$)|\.(?:gif|jpeg|jpg|ico|png|svg)$/,
  }
  config.plugins?.push(
    new DefinePlugin({
      'process.env.DOCS_SHEETS_KEY': JSON.stringify(isStandaloneEditor ? undefined : process.env.DOCS_SHEETS_KEY),
    }),
  )
  if (webpackOptions.appMode === 'standalone' && !isStandaloneEditor) {
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
