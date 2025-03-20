import type { Configuration } from 'webpack'
import path from 'node:path'
import HtmlWebpackPlugin from 'html-webpack-plugin'

import getConfig from '@proton/pack/webpack.config'
import { addDevEntry, getIndexChunks } from '@proton/pack/webpack/entries';

const result = (env: Record<string, any>): Configuration => {
  const config = getConfig(env)
  if (env.appMode === 'standalone') {
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

  config.plugins.splice(
    htmlIndex,
    1,
    new HtmlWebpackPlugin({
      filename: 'index.html',
      template: 'ejs-webpack-loader!src/app.ejs',
      templateParameters: htmlPlugin.userOptions.templateParameters,
      scriptLoading: 'defer',
      inject: true,
      chunks: getIndexChunks('index', true),
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

  return config
}

export default result
