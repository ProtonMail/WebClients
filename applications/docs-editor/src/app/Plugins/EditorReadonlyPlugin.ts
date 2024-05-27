import { useEffect } from 'react'
import { useInternalEventBus } from '../InternalEventBusProvider'
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext'
import { DocStateInterface, EditorEditableChangeEvent, EditorEditableChangeEventData } from '@proton/docs-shared'

export function EditorReadonlyPlugin({ docState }: { docState: DocStateInterface }) {
  const eventBus = useInternalEventBus()
  const [editor] = useLexicalComposerContext()

  useEffect(() => {
    return eventBus.addEventCallback<EditorEditableChangeEventData>((data) => {
      editor.setEditable(docState.canBeEditable ? data.editable : false)
    }, EditorEditableChangeEvent)
  }, [editor, eventBus])

  return null
}
