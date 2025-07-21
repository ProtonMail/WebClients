import type { Configuration } from 'webpack'
import path from 'node:path'
import HtmlWebpackPlugin from 'html-webpack-plugin'

import { getIndexChunks } from '@proton/pack/webpack/entries'

import { type WebpackEnvArgumentsV2, getWebpackOptions } from '@proton/pack/lib/configV2'
import { addDevEntry, getConfigV2 } from '@proton/pack/webpack.config'

import appConfig from './appConfig'

const result = (opts: WebpackEnvArgumentsV2): Configuration => {
  const webpackOptions = getWebpackOptions(opts, { appConfig })
  const config = getConfigV2(webpackOptions)

  if (webpackOptions.appMode === 'standalone') {
    addDevEntry(config)
  }

  config.plugins = config.plugins || []

  const htmlPlugin = config.plugins.find((plugin): plugin is HtmlWebpackPlugin => {
    return plugin instanceof HtmlWebpackPlugin
  })
  if (!htmlPlugin) {
    throw new Error('Missing html plugin')
  }

  const htmlIndex = config.plugins.indexOf(htmlPlugin)

  const templateParameters = {
    ...htmlPlugin.userOptions.templateParameters,
    defineWebpackConfig: JSON.stringify(webpackOptions.defineWebpackConfig),
  }

  config.plugins.splice(
    htmlIndex,
    1,
    new HtmlWebpackPlugin({
      chunks: getIndexChunks('index', true),
      filename: 'index.html',
      inject: true,
      scriptLoading: 'defer',
      template: 'ejs-webpack-loader!src/app.ejs',
      templateParameters,
    }),
  )

  config.resolve = {
    ...config.resolve,
    alias: {
      ...config.resolve?.alias,
      // Support import aliases.
      '~/components': path.resolve(__dirname, 'src/app/components'),
      '~/utils': path.resolve(__dirname, 'src/app/utils'),
      '~/redux-store': path.resolve(__dirname, 'src/app/redux-store'),
      '~/config': path.resolve(__dirname, 'src/app/config'),
    },
    extensions: ['.ts', '.tsx', '.js', '.jsx', '.json'],
  }

  // @ts-expect-error
  const scssRule = config.module.rules.find((rule) => rule.test.toString().includes('scss'))
  // @ts-expect-error
  const postCssLoader = scssRule.use.find((use) => use.loader.includes('postcss-loader')) as unknown
  // @ts-expect-error
  postCssLoader.options.postcssOptions.plugins.push(require('tailwindcss')())

  // @ts-expect-error
  const jsLoader = config.module.rules.find((rule) => rule.test.toString().includes('tsx?'))
  // @ts-expect-error
  jsLoader.use.options.plugins.push(require('@babel/plugin-transform-private-methods').default)

  return config
}

export default result
