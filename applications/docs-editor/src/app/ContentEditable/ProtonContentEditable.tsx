import type { Props as ElementProps } from './ProtonContentEditableElement'
import type { LexicalEditor } from 'lexical'

import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext'
import type { Ref } from 'react'
import { forwardRef, useLayoutEffect, useState } from 'react'

import { ContentEditableElement } from './ProtonContentEditableElement'
import { useCanShowPlaceholder } from '../Shared/useCanShowPlaceholder'

export type Props = Omit<ElementProps, 'editor'> & {
  editor__DEPRECATED?: LexicalEditor
} & (
    | {
        'aria-placeholder'?: void
        placeholder?: null
      }
    | {
        'aria-placeholder': string
        placeholder: ((isEditable: boolean) => null | JSX.Element) | JSX.Element
      }
  )

/**
 * We need our own ContentEditable implementation because we need to
 * add our own low-level event listeners before Lexical does, so that
 * we can block Lexical from handling them and instead handle them ourselves.
 */
export const ProtonContentEditable = forwardRef(ContentEditableImpl)

function ContentEditableImpl(props: Props, ref: Ref<HTMLDivElement>): JSX.Element {
  const { placeholder, editor__DEPRECATED, ...rest } = props
  // editor__DEPRECATED will always be defined for non MLC surfaces
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const editor = editor__DEPRECATED || useLexicalComposerContext()[0]

  return (
    <>
      <ContentEditableElement editor={editor} {...rest} ref={ref} />
      {placeholder != null && <Placeholder editor={editor} content={placeholder} />}
    </>
  )
}

function Placeholder({
  content,
  editor,
}: {
  editor: LexicalEditor
  content: ((isEditable: boolean) => null | JSX.Element) | JSX.Element
}): null | JSX.Element {
  const showPlaceholder = useCanShowPlaceholder(editor)

  const [isEditable, setEditable] = useState(editor.isEditable())
  useLayoutEffect(() => {
    setEditable(editor.isEditable())
    return editor.registerEditableListener((currentIsEditable) => {
      setEditable(currentIsEditable)
    })
  }, [editor])

  if (!showPlaceholder) {
    return null
  }

  let placeholder = null
  if (typeof content === 'function') {
    placeholder = content(isEditable)
  } else if (content !== null) {
    placeholder = content
  }

  if (placeholder === null) {
    return null
  }
  return <div aria-hidden={true}>{placeholder}</div>
}
