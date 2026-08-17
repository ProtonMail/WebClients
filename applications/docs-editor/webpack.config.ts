import { DefinePlugin, type Configuration } from 'webpack'
import { config as dotenvConfig } from 'dotenv'
import path from 'node:path'
dotenvConfig({ path: path.join(__dirname, '.env') })

import { type WebpackEnvArguments, getWebpackOptions } from '@proton/pack/lib/config'
import { addDevEntry, getConfig } from '@proton/pack/webpack.config'

import appConfig from './appConfig'

const result = (opts: WebpackEnvArguments): Configuration => {
  const webpackOptions = getWebpackOptions(opts, { appConfig })
  const config = getConfig(webpackOptions)

  config.watchOptions = {
    ...config.watchOptions,
    // Rows n Columns packages are vendored as built files, so their dist directories must remain watchable.
    ignored:
      /^(?!.*\/vendor\/rowsncolumns\/).*\/dist(?:\/|$)|\/node_modules(?:\/|$)|\/locales(?:\/|$)|\.(?:gif|jpeg|jpg|ico|png|svg)$/,
  }
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
