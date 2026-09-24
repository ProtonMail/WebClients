import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext'
import { type WordCountInfoCollection, createWordCountInfo } from '@proton/docs-shared'
import { useEffect } from 'react'
import { $getRoot, $getSelection } from 'lexical'

type WordCountPluginProps = {
  onWordCountChange: (wordCountInfoCollection: WordCountInfoCollection) => void
}

export function WordCountPlugin({ onWordCountChange }: WordCountPluginProps) {
  const [editor] = useLexicalComposerContext()
  useEffect(() => {
    return editor.registerUpdateListener(({ editorState }) => {
      editorState.read(() => {
        const selectionTextContent = $getSelection()?.getTextContent()
        const rootTextContent = $getRoot().getTextContent()

        const wordCountInfoCollection: WordCountInfoCollection = {
          document: createWordCountInfo(rootTextContent),
          selection: selectionTextContent ? createWordCountInfo(selectionTextContent) : undefined,
        }
        onWordCountChange(wordCountInfoCollection)
      })
    })
  }, [editor, onWordCountChange])
  return null
}
