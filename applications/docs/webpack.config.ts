import type { Configuration } from 'webpack'

import getConfig from '@proton/pack/webpack.config'
import { addDevEntry } from '@proton/pack/webpack/entries'

const result = (env: Record<string, any>): Configuration => {
  const config = getConfig(env)
  if (env.appMode === 'standalone') {
    addDevEntry(config)
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
