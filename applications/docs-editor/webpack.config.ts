import type { Configuration } from 'webpack'
import getConfig from '@proton/pack/webpack.config'
import { addDevEntry } from '@proton/pack/webpack/entries'
import * as path from 'path'

const result = (env: any): Configuration => {
  const config = getConfig(env)

  if (env.appMode === 'standalone') {
    addDevEntry(config)
  }

  /**
   * To get proper sourcemaps for Lexical, we need to use their development builds, which we will handle minifying ourself
   * and including in our own sourcemaps.
   *
   * To do this, determine all invokved Lexical paths by temporarily enabling this plugin:
   *
    const uniqueRequests = new Set()
    class LexicalPathPrinter {
      apply(resolver: any) {
        resolver.hooks.resolve.tapAsync('LexicalPathPrinter', (request: any, context: any, callback: any) => {
          if (request.request && (request.request.startsWith('@lexical') || request.request === 'lexical')) {
            uniqueRequests.add(request.request)
          }
          console.log('Unique Lexical paths:', uniqueRequests)
          callback()
        })
      }
    }

    config.resolve = {
      ...config.resolve,
      plugins: [...(config.resolve?.plugins || []), new LexicalPathPrinter()],
    }

   * Then for every path in the logged array, add a manual entry in `alias` below.
   * To verify it worked, cause Lexical to throw an exception in the code, via something like:
   *
   *   useEffect(() => {
   *     $createTextNode(undefined)
   *   }, [])
   *
   * Build and run the application via `yarn build:web && python3 -m http.server 8001 --directory dist`.
   * Open in browser, notice exception, and notice it should say ...dev.mjs instead of .prod.mjs.
   */

  config.resolve = {
    ...config.resolve,

    alias: {
      ...config.resolve?.alias,
      lexical: path.resolve(__dirname, '../../node_modules/lexical/Lexical.dev.mjs'),
      '@lexical/clipboard': path.resolve(__dirname, '../../node_modules/@lexical/clipboard/LexicalClipboard.dev.mjs'),
      '@lexical/code': path.resolve(__dirname, '../../node_modules/@lexical/code/LexicalCode.dev.mjs'),
      '@lexical/devtools-core': path.resolve(__dirname, '../../node_modules/@lexical/devtools-core/LexicalDevtoolsCore.dev.mjs'),
      '@lexical/dragon': path.resolve(__dirname, '../../node_modules/@lexical/dragon/LexicalDragon.dev.mjs'),
      '@lexical/hashtag': path.resolve(__dirname, '../../node_modules/@lexical/hashtag/LexicalHashtag.dev.mjs'),
      '@lexical/headless': path.resolve(__dirname, '../../node_modules/@lexical/headless/LexicalHeadless.dev.mjs'),
      '@lexical/history': path.resolve(__dirname, '../../node_modules/@lexical/history/LexicalHistory.dev.mjs'),
      '@lexical/html': path.resolve(__dirname, '../../node_modules/@lexical/html/LexicalHtml.dev.mjs'),
      '@lexical/link': path.resolve(__dirname, '../../node_modules/@lexical/link/LexicalLink.dev.mjs'),
      '@lexical/list': path.resolve(__dirname, '../../node_modules/@lexical/list/LexicalList.dev.mjs'),
      '@lexical/mark': path.resolve(__dirname, '../../node_modules/@lexical/mark/LexicalMark.dev.mjs'),
      '@lexical/markdown': path.resolve(__dirname, '../../node_modules/@lexical/markdown/LexicalMarkdown.dev.mjs'),
      '@lexical/offset': path.resolve(__dirname, '../../node_modules/@lexical/offset/LexicalOffset.dev.mjs'),
      '@lexical/overflow': path.resolve(__dirname, '../../node_modules/@lexical/overflow/LexicalOverflow.dev.mjs'),
      '@lexical/react/LexicalAutoFocusPlugin': path.resolve(__dirname, '../../node_modules/@lexical/react/LexicalAutoFocusPlugin.dev.mjs'),
      '@lexical/react/LexicalClearEditorPlugin': path.resolve(__dirname, '../../node_modules/@lexical/react/LexicalClearEditorPlugin.dev.mjs'),
      '@lexical/react/LexicalCollaborationContext': path.resolve(__dirname, '../../node_modules/@lexical/react/LexicalCollaborationContext.dev.mjs'),
      '@lexical/react/LexicalComposer': path.resolve(__dirname, '../../node_modules/@lexical/react/LexicalComposer.dev.mjs'),
      '@lexical/react/LexicalComposerContext': path.resolve(__dirname, '../../node_modules/@lexical/react/LexicalComposerContext.dev.mjs'),
      '@lexical/react/LexicalContentEditable': path.resolve(__dirname, '../../node_modules/@lexical/react/LexicalContentEditable.dev.mjs'),
      '@lexical/react/LexicalEditorRefPlugin': path.resolve(__dirname, '../../node_modules/@lexical/react/LexicalEditorRefPlugin.dev.mjs'),
      '@lexical/react/LexicalErrorBoundary': path.resolve(__dirname, '../../node_modules/@lexical/react/LexicalErrorBoundary.dev.mjs'),
      '@lexical/react/LexicalHistoryPlugin': path.resolve(__dirname, '../../node_modules/@lexical/react/LexicalHistoryPlugin.dev.mjs'),
      '@lexical/react/LexicalHorizontalRuleNode': path.resolve(__dirname, '../../node_modules/@lexical/react/LexicalHorizontalRuleNode.dev.mjs'),
      '@lexical/react/LexicalHorizontalRulePlugin': path.resolve(__dirname, '../../node_modules/@lexical/react/LexicalHorizontalRulePlugin.dev.mjs'),
      '@lexical/react/LexicalLinkPlugin': path.resolve(__dirname, '../../node_modules/@lexical/react/LexicalLinkPlugin.dev.mjs'),
      '@lexical/react/LexicalListPlugin': path.resolve(__dirname, '../../node_modules/@lexical/react/LexicalListPlugin.dev.mjs'),
      '@lexical/react/LexicalMarkdownShortcutPlugin': path.resolve(__dirname, '../../node_modules/@lexical/react/LexicalMarkdownShortcutPlugin.dev.mjs'),
      '@lexical/react/LexicalOnChangePlugin': path.resolve(__dirname, '../../node_modules/@lexical/react/LexicalOnChangePlugin.dev.mjs'),
      '@lexical/react/LexicalRichTextPlugin': path.resolve(__dirname, '../../node_modules/@lexical/react/LexicalRichTextPlugin.dev.mjs'),
      '@lexical/react/LexicalTabIndentationPlugin': path.resolve(__dirname, '../../node_modules/@lexical/react/LexicalTabIndentationPlugin.dev.mjs'),
      '@lexical/react/LexicalTreeView': path.resolve(__dirname, '../../node_modules/@lexical/react/LexicalTreeView.dev.mjs'),
      '@lexical/react/useLexicalEditable': path.resolve(__dirname, '../../node_modules/@lexical/react/useLexicalEditable.dev.mjs'),
      '@lexical/react/useLexicalNodeSelection': path.resolve(__dirname, '../../node_modules/@lexical/react/useLexicalNodeSelection.dev.mjs'),
      '@lexical/rich-text': path.resolve(__dirname, '../../node_modules/@lexical/rich-text/LexicalRichText.dev.mjs'),
      '@lexical/selection': path.resolve(__dirname, '../../node_modules/@lexical/selection/LexicalSelection.dev.mjs'),
      '@lexical/table': path.resolve(__dirname, '../../node_modules/@lexical/table/LexicalTable.dev.mjs'),
      '@lexical/text': path.resolve(__dirname, '../../node_modules/@lexical/text/LexicalText.dev.mjs'),
      '@lexical/utils': path.resolve(__dirname, '../../node_modules/@lexical/utils/LexicalUtils.dev.mjs'),
      '@lexical/yjs': path.resolve(__dirname, '../../node_modules/@lexical/yjs/LexicalYjs.dev.mjs'),
    },
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
