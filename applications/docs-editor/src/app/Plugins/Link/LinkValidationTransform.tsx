import { LinkNode } from '@lexical/link'
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext'
import { useLexicalEditable } from '@lexical/react/useLexicalEditable'
import { useEffect } from 'react'
import { sanitizeUrl } from '../../Utils/sanitizeUrl'

export function LinkValidationTransform() {
  const [editor] = useLexicalComposerContext()
  const isEditable = useLexicalEditable()

  useEffect(() => {
    if (!isEditable) {
      return
    }

    return editor.registerNodeTransform(LinkNode, (node) => {
      const currentURL = node.getURL()
      const sanitizedURL = sanitizeUrl(currentURL)
      if (!sanitizedURL) {
        // Remove the link if the URL is invalid
        const nodeChildren = node.getChildren()
        for (const child of nodeChildren) {
          node.insertBefore(child)
        }
        node.remove()
      }
      if (sanitizedURL && sanitizedURL !== currentURL) {
        // Update the URL if it has been sanitized
        node.setURL(sanitizedURL)
      }
    })
  }, [editor, isEditable])

  return null
}
