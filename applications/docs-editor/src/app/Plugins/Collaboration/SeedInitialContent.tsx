import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext'
import { DocStateInterface, FileToDocPendingConversion } from '@proton/docs-shared'
import { useEffect, useRef } from 'react'
import { $importDataIntoEditor } from '../../Tools/Conversion'

type Props = {
  docState: DocStateInterface
  content?: FileToDocPendingConversion
}

export default function SeedInitialContentPlugin({ docState, content }: Props): JSX.Element | null {
  const [editor] = useLexicalComposerContext()
  const seededInitialContent = useRef(false)

  useEffect(() => {
    if (!content) {
      return
    }

    if (seededInitialContent.current) {
      return
    }

    $importDataIntoEditor(editor, content.data, content.type)
      .then(() => {
        seededInitialContent.current = true
      })
      .catch(console.error)
  }, [content, docState, editor])

  return null
}
