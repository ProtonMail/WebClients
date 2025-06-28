import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext'
import { TableOfContentsPlugin } from '@lexical/react/LexicalTableOfContentsPlugin'
import { DropdownMenu, DropdownMenuButton } from '@proton/components'
import type { NodeKey } from 'lexical'
import { $getNodeByKey } from 'lexical'
import { useCallback } from 'react'
import { c } from 'ttag'

export function TableOfContents() {
  const [editor] = useLexicalComposerContext()

  const selectAndScrollToNode = useCallback(
    (key: NodeKey) => {
      editor.update(() => {
        const node = $getNodeByKey(key)
        if (!node) {
          return
        }
        node.selectStart()
        editor.focus()
        const element = editor.getElementByKey(key)
        if (!element) {
          return
        }
        const shouldSmoothScroll = !window.matchMedia('(prefers-reduced-motion: reduce)').matches
        element.scrollIntoView({
          block: 'start',
          behavior: shouldSmoothScroll ? 'smooth' : 'instant',
        })
      })
    },
    [editor],
  )

  return (
    <TableOfContentsPlugin>
      {(tableOfContents) => {
        if (!tableOfContents.length) {
          return (
            <div className="px-3 py-2 text-center text-sm">{c('Info')
              .t`Headings you add to the document will appear here.`}</div>
          )
        }

        return (
          <DropdownMenu>
            {tableOfContents.map(([key, text, tag]) => {
              let level = parseInt(tag.slice(1)) - 1
              if (Number.isNaN(level) || level < 0) {
                level = 0
              }
              return (
                <DropdownMenuButton
                  key={key}
                  className="flex flex-nowrap items-center text-left text-sm"
                  onClick={() => {
                    selectAndScrollToNode(key)
                  }}
                >
                  <div
                    style={{
                      '--level': level,
                      '--spacing': '1.5ch',
                      width: `calc(var(--level) * var(--spacing))`,
                    }}
                  />
                  {text}
                </DropdownMenuButton>
              )
            })}
          </DropdownMenu>
        )
      }}
    </TableOfContentsPlugin>
  )
}
