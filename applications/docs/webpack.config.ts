import type { Configuration } from 'webpack'
import path from 'node:path'

import getConfig from '@proton/pack/webpack.config'
import { addDevEntry } from '@proton/pack/webpack/entries'

const result = (env: Record<string, any>): Configuration => {
  const config = getConfig(env)
  if (env.appMode === 'standalone') {
    addDevEntry(config)
  }
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
