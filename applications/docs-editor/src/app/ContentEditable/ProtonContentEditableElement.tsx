import type { LexicalEditor } from 'lexical'

import type { Ref } from 'react'
import { forwardRef, useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { mergeRefs } from '../Shared/mergeRefs'
import { BEFOREINPUT_EVENT_COMMAND, INPUT_EVENT_COMMAND } from '../Commands/Events'
import { SUGGESTION_MODE_KEYDOWN_COMMAND } from '../Plugins/Suggestions/Commands'

export type Props = {
  editor: LexicalEditor
  isSuggestionMode: boolean
  ariaActiveDescendant?: React.AriaAttributes['aria-activedescendant']
  ariaAutoComplete?: React.AriaAttributes['aria-autocomplete']
  ariaControls?: React.AriaAttributes['aria-controls']
  ariaDescribedBy?: React.AriaAttributes['aria-describedby']
  ariaExpanded?: React.AriaAttributes['aria-expanded']
  ariaLabel?: React.AriaAttributes['aria-label']
  ariaLabelledBy?: React.AriaAttributes['aria-labelledby']
  ariaMultiline?: React.AriaAttributes['aria-multiline']
  ariaOwns?: React.AriaAttributes['aria-owns']
  ariaRequired?: React.AriaAttributes['aria-required']
  autoCapitalize?: HTMLDivElement['autocapitalize']
  'data-testid'?: string | null | undefined
} & Omit<React.AllHTMLAttributes<HTMLDivElement>, 'placeholder'>

function ContentEditableElementImpl(
  {
    editor,
    isSuggestionMode,
    ariaActiveDescendant,
    ariaAutoComplete,
    ariaControls,
    ariaDescribedBy,
    ariaExpanded,
    ariaLabel,
    ariaLabelledBy,
    ariaMultiline,
    ariaOwns,
    ariaRequired,
    autoCapitalize,
    className,
    id,
    role = 'textbox',
    spellCheck = true,
    style,
    tabIndex,
    'data-testid': testid,
    ...rest
  }: Props,
  ref: Ref<HTMLDivElement>,
): JSX.Element {
  const [isEditable, setEditable] = useState(editor.isEditable())

  const isSuggestionModeRef = useRef(isSuggestionMode)
  useEffect(() => {
    isSuggestionModeRef.current = isSuggestionMode
  }, [isSuggestionMode])

  const handleRef = useCallback(
    (rootElement: null | HTMLElement) => {
      if (rootElement) {
        rootElement.addEventListener('keydown', (event) => {
          if (isSuggestionModeRef.current) {
            // We don't want to preventDefault keydown
            // as that will also stop beforeinput events
            // from being triggered.
            event.stopImmediatePropagation()
            editor.dispatchCommand(SUGGESTION_MODE_KEYDOWN_COMMAND, event)
          }
        })
        rootElement.addEventListener('input', (event) => {
          if (isSuggestionModeRef.current) {
            event.preventDefault()
            event.stopImmediatePropagation()
            editor.dispatchCommand(INPUT_EVENT_COMMAND, event)
          }
        })
        rootElement.addEventListener('beforeinput', (event) => {
          if (isSuggestionModeRef.current) {
            event.preventDefault()
            event.stopImmediatePropagation()
            editor.dispatchCommand(BEFOREINPUT_EVENT_COMMAND, event)
          }
        })
      }
      // defaultView is required for a root element.
      // In multi-window setups, the defaultView may not exist at certain points.
      if (rootElement && rootElement.ownerDocument && rootElement.ownerDocument.defaultView) {
        editor.setRootElement(rootElement)
      } else {
        editor.setRootElement(null)
      }
    },
    [editor],
  )
  const mergedRefs = useMemo(() => mergeRefs(ref, handleRef), [handleRef, ref])

  useLayoutEffect(() => {
    setEditable(editor.isEditable())
    return editor.registerEditableListener((currentIsEditable) => {
      setEditable(currentIsEditable)
    })
  }, [editor])

  return (
    // eslint-disable-next-line jsx-a11y/aria-activedescendant-has-tabindex
    <div
      {...rest}
      aria-activedescendant={isEditable ? ariaActiveDescendant : undefined}
      aria-autocomplete={isEditable ? ariaAutoComplete : 'none'}
      aria-controls={isEditable ? ariaControls : undefined}
      aria-describedby={ariaDescribedBy}
      aria-expanded={isEditable && role === 'combobox' ? !!ariaExpanded : undefined}
      aria-label={ariaLabel}
      aria-labelledby={ariaLabelledBy}
      aria-multiline={ariaMultiline}
      aria-owns={isEditable ? ariaOwns : undefined}
      aria-readonly={isEditable ? undefined : true}
      aria-required={ariaRequired}
      autoCapitalize={autoCapitalize}
      className={className}
      contentEditable={isEditable}
      data-testid={testid}
      id={id}
      ref={mergedRefs}
      role={isEditable ? role : undefined}
      spellCheck={spellCheck}
      style={style}
      tabIndex={tabIndex}
    />
  )
}

export const ContentEditableElement = forwardRef(ContentEditableElementImpl)
