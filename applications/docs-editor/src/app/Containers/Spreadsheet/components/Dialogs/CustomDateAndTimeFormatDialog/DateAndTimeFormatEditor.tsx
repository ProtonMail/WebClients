import { type InitialConfigType, LexicalComposer } from '@lexical/react/LexicalComposer'
import { PlainTextPlugin } from '@lexical/react/LexicalPlainTextPlugin'
import { ContentEditable } from '@lexical/react/LexicalContentEditable'
import { forwardRef, useEffect, useImperativeHandle, useMemo, useRef, useState } from 'react'
import { LexicalErrorBoundary } from '@lexical/react/LexicalErrorBoundary'
import clsx from '@proton/utils/clsx'
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext'
import { useLexicalNodeSelection } from '@lexical/react/useLexicalNodeSelection'
import {
  $createParagraphNode,
  $createTextNode,
  $getNodeByKey,
  $getRoot,
  $getSelection,
  $isElementNode,
  $isNodeSelection,
  $isRangeSelection,
  COMMAND_PRIORITY_HIGH,
  COMMAND_PRIORITY_LOW,
  DecoratorNode,
  KEY_ARROW_LEFT_COMMAND,
  KEY_ARROW_RIGHT_COMMAND,
  KEY_BACKSPACE_COMMAND,
  KEY_DELETE_COMMAND,
  LineBreakNode,
  PASTE_COMMAND,
  type LexicalEditor,
  type NodeKey,
  type SerializedLexicalNode,
  type Spread,
} from 'lexical'
import { mergeRegister } from '@lexical/utils'
import * as Ariakit from '@ariakit/react'
import { Icon } from '../../ui'
import { Button } from '../../Sidebar/shared'
import * as Atoms from '../../atoms'
import { EditorRefPlugin } from '@lexical/react/LexicalEditorRefPlugin'
import { OnChangePlugin } from '@lexical/react/LexicalOnChangePlugin'
import { HistoryPlugin } from '@lexical/react/LexicalHistoryPlugin'
import { useUI } from '../../../ui-store'
import * as Icons from '../../icons'
import * as UI from '../../ui'
import {
  MENU_COLUMNS,
  TOKENS_BY_CATEGORY,
  type TokenPointer,
  getTokenExample,
  parsePattern,
  s,
  serializeLiteral,
} from './customDateAndTimeFormat'

type DateAndTimeFormatEditorProps = {
  initialPattern?: string
  onPatternChange?: (pattern: string) => void
}

export type DateAndTimeFormatEditorRef = {
  setPattern: (pattern: string) => void
  getPattern: () => string
}

export const DateAndTimeFormatEditor = forwardRef<DateAndTimeFormatEditorRef, DateAndTimeFormatEditorProps>(
  function DateAndTimeFormatEditor(props, ref) {
    const [initialConfig] = useState<InitialConfigType>(() => {
      return {
        namespace: 'DateAndTimeFormatEditor',
        nodes: [TokenNode],
        onError: (error) => {
          console.error(error)
        },
      }
    })

    const editorRef = useRef<LexicalEditor | null>(null)

    useImperativeHandle(
      ref,
      () => ({
        setPattern(pattern: string) {
          const editor = editorRef.current
          if (!editor) {
            return
          }
          editor.update(() => {
            $writePattern(pattern)
            $getRoot().selectEnd()
          })
        },
        getPattern() {
          const editor = editorRef.current
          if (!editor) {
            return ''
          }
          return editor.getEditorState().read($readPattern)
        },
      }),
      [],
    )

    return (
      <div
        className={clsx(
          'rounded-lg border border-[#EAE7E4] px-3 py-2 !outline-none',
          'transition focus-within:border-[#6D4AFF] focus-within:ring-[3px] focus-within:ring-[#6D4AFF33]',
          'flex min-w-0 items-start',
        )}
      >
        <LexicalComposer initialConfig={initialConfig}>
          <div className="flex min-w-0 grow flex-col self-stretch">
            <div className="grow" />
            <PlainTextPlugin
              contentEditable={
                <ContentEditable spellCheck={false} className="min-w-0 grow text-sm/8 text-[#0C0C14] !outline-none" />
              }
              ErrorBoundary={LexicalErrorBoundary}
            />
            <div className="grow" />
          </div>
          <EditorRefPlugin editorRef={editorRef} />
          <HistoryPlugin />
          <NoLinebreaksPlugin />
          <ChipKeyboardPlugin />
          <ClipboardPlugin />
          <InitialPatternPlugin pattern={props.initialPattern ?? ''} />
          <TokenMenu />
          <OnChangePlugin
            ignoreSelectionChange
            // The initial seed is tagged `history-merge`; without this it would be ignored and the
            // dialog's pattern state wouldn't sync on open.
            ignoreHistoryMergeTagChange={false}
            onChange={(editorState) => {
              const pattern = editorState.read($readPattern)
              props.onPatternChange?.(pattern)
            }}
          />
        </LexicalComposer>
      </div>
    )
  },
)

type SerializedTokenNode = Spread<{ tokenPointer: TokenPointer }, SerializedLexicalNode>

class TokenNode extends DecoratorNode<JSX.Element> {
  __tokenPointer: TokenPointer

  static getType(): string {
    return 'token'
  }

  static clone(node: TokenNode): TokenNode {
    return new TokenNode(node.__tokenPointer, node.__key)
  }

  constructor(tokenPointer: TokenPointer, key?: NodeKey) {
    super(key)
    this.__tokenPointer = tokenPointer
  }

  getCode(): string {
    return this.getLatest().__tokenPointer.code
  }

  setCode(code: string): void {
    const writable = this.getWritable()
    writable.__tokenPointer = { ...writable.__tokenPointer, code } as TokenPointer
  }

  // The token's plain-text form is its SSF code, so copying a selection yields a valid pattern fragment
  // that paste can re-tokenize via parsePattern.
  getTextContent(): string {
    return this.getLatest().__tokenPointer.code
  }

  static importJSON(json: SerializedTokenNode): TokenNode {
    return new TokenNode(json.tokenPointer)
  }

  exportJSON(): SerializedTokenNode {
    return {
      ...super.exportJSON(),
      type: 'token',
      tokenPointer: this.__tokenPointer,
      version: 1,
    }
  }

  createDOM(): HTMLElement {
    const span = document.createElement('span')
    span.contentEditable = 'false'
    span.style.display = 'inline-block'
    return span
  }

  updateDOM() {
    return false
  }

  isInline() {
    return true
  }

  decorate(): JSX.Element {
    return <TokenChip nodeKey={this.__key} tokenPointer={this.__tokenPointer} />
  }
}

function $createTokenNode(tokenPointer: TokenPointer): TokenNode {
  return new TokenNode(tokenPointer)
}

function $isTokenNode(node: unknown): node is TokenNode {
  return node instanceof TokenNode
}

// Replaces the editor's content with the nodes parsed from an SSF pattern. Must run within editor.update.
function $writePattern(pattern: string): void {
  const root = $getRoot()
  root.clear()
  const paragraph = $createParagraphNode()
  for (const segment of parsePattern(pattern)) {
    if (segment.kind === 'token') {
      paragraph.append($createTokenNode(segment.pointer))
    } else {
      paragraph.append($createTextNode(segment.text))
    }
  }
  root.append(paragraph)
}

// Serializes the current editor content into an SSF pattern. Must run within an editor read/update.
function $readPattern(): string {
  let pattern = ''
  for (const block of $getRoot().getChildren()) {
    if (!$isElementNode(block)) {
      continue
    }
    for (const child of block.getChildren()) {
      if ($isTokenNode(child)) {
        pattern += child.getCode()
      } else {
        pattern += serializeLiteral(child.getTextContent())
      }
    }
  }
  return pattern
}

function TokenChip({ nodeKey, tokenPointer }: { nodeKey: NodeKey; tokenPointer: TokenPointer }) {
  const [editor] = useLexicalComposerContext()
  const [isSelected] = useLexicalNodeSelection(nodeKey)
  const locale = useUI((ui) => ui.locale)
  const buttonRef = useRef<HTMLButtonElement>(null)

  // Mirror Lexical's node selection onto DOM focus, so a selected chip is keyboard-operable
  // (Enter/↓ opens the variant menu) instead of leaving focus on the editor root.
  useEffect(() => {
    if (isSelected) {
      buttonRef.current?.focus()
    }
  }, [isSelected])

  const deleteToken = () => {
    editor.update(() => {
      $getNodeByKey(nodeKey)?.remove()
    })
  }

  const setVariant = (code: string) => {
    editor.update(() => {
      const node = $getNodeByKey(nodeKey)
      if ($isTokenNode(node)) {
        node.setCode(code)
      }
    })
  }

  const tokenDef = useMemo(() => {
    for (const category of TOKENS_BY_CATEGORY) {
      for (const def of category.tokenDefs) {
        if (def.type === tokenPointer.type) {
          return def
        }
      }
    }
    return null
  }, [tokenPointer.type])

  const example = useMemo(() => getTokenExample(tokenPointer, locale.resolved), [tokenPointer, locale.resolved])

  if (!tokenDef) {
    return null
  }

  return (
    <Ariakit.MenuProvider>
      <Ariakit.MenuButton
        ref={buttonRef}
        className={clsx(
          'h-7 select-none rounded bg-[white] pl-1.5 pr-1 text-xs font-medium',
          'inline-flex items-center justify-center',
          'border border-[#E9E9E9] !outline-none',
          isSelected && 'ring-2 ring-[#6D4AFF]',
        )}
      >
        {tokenDef.label} ({example})
        <span className="ml-0.5">
          <Icon data={Icons.chevronUpDown} />
        </span>
      </Ariakit.MenuButton>

      <Atoms.DropdownPopover {...Atoms.DROPDOWN_POPOVER_DEFAULTS} render={<Ariakit.Menu />}>
        <UI.MenuGroup>
          {tokenDef.variants.map((variant) => (
            <UI.MenuItem key={variant.code} onClick={() => setVariant(variant.code)}>
              {variant.label} (
              {getTokenExample({ type: tokenPointer.type, code: variant.code } as TokenPointer, locale.resolved)})
            </UI.MenuItem>
          ))}
          <UI.MenuSeparator />
          <UI.MenuItem onClick={deleteToken}>{s('Delete')}</UI.MenuItem>
        </UI.MenuGroup>
      </Atoms.DropdownPopover>
    </Ariakit.MenuProvider>
  )
}

function NoLinebreaksPlugin() {
  const [editor] = useLexicalComposerContext()

  useEffect(() => {
    return editor.registerNodeTransform(LineBreakNode, (node) => node.remove())
  }, [editor])

  return null
}

function ChipKeyboardPlugin() {
  const [editor] = useLexicalComposerContext()

  useEffect(() => {
    const moveOut = (direction: 'next' | 'previous') => (event: KeyboardEvent | null) => {
      const selection = $getSelection()
      if (!$isNodeSelection(selection)) {
        return false
      }
      const node = selection.getNodes().find($isTokenNode)
      if (!node) {
        return false
      }
      event?.preventDefault()
      if (direction === 'next') {
        node.selectNext(0, 0)
      } else {
        node.selectPrevious()
      }
      return true
    }

    // PlainTextPlugin doesn't delete a decorator on a node selection, and the selected chip holds DOM
    // focus on its button — so we move the selection back into the editor before removing the node,
    // otherwise focus would fall to <body> when the button unmounts.
    const removeSelectedToken = (event: KeyboardEvent | null) => {
      const selection = $getSelection()
      if (!$isNodeSelection(selection)) {
        return false
      }
      const node = selection.getNodes().find($isTokenNode)
      if (!node) {
        return false
      }
      event?.preventDefault()
      if (node.getPreviousSibling()) {
        node.selectPrevious()
      } else if (node.getNextSibling()) {
        node.selectNext(0, 0)
      } else {
        $getRoot().selectEnd()
      }
      node.remove()
      return true
    }

    return mergeRegister(
      editor.registerCommand(KEY_ARROW_LEFT_COMMAND, moveOut('previous'), COMMAND_PRIORITY_LOW),
      editor.registerCommand(KEY_ARROW_RIGHT_COMMAND, moveOut('next'), COMMAND_PRIORITY_LOW),
      editor.registerCommand(KEY_BACKSPACE_COMMAND, removeSelectedToken, COMMAND_PRIORITY_LOW),
      editor.registerCommand(KEY_DELETE_COMMAND, removeSelectedToken, COMMAND_PRIORITY_LOW),
    )
  }, [editor])

  return null
}

// Tokens copy as their SSF code (see TokenNode.getTextContent), so the clipboard's plain text is a valid
// pattern fragment. On paste we re-tokenize it through parsePattern and insert reconstructed nodes, which
// is what makes copy/cut/paste of chips work (the lexical/HTML clipboard payloads don't carry token data).
function ClipboardPlugin() {
  const [editor] = useLexicalComposerContext()

  useEffect(() => {
    return editor.registerCommand(
      PASTE_COMMAND,
      (event) => {
        const text = (event as ClipboardEvent).clipboardData?.getData('text/plain')
        if (!text) {
          return false
        }
        event.preventDefault()
        editor.update(() => {
          const selection = $getSelection()
          if (!selection) {
            return
          }
          const nodes = parsePattern(text).map((segment) =>
            segment.kind === 'token' ? $createTokenNode(segment.pointer) : $createTextNode(segment.text),
          )
          selection.insertNodes(nodes)
        })
        return true
      },
      // Higher than PlainTextPlugin's handler so we reconstruct tokens instead of inserting raw text.
      COMMAND_PRIORITY_HIGH,
    )
  }, [editor])

  return null
}

function InitialPatternPlugin({ pattern }: { pattern: string }) {
  const [editor] = useLexicalComposerContext()
  const initialPattern = useRef(pattern)

  useEffect(() => {
    if (!initialPattern.current) {
      return
    }
    editor.update(
      () => {
        $writePattern(initialPattern.current)
        $getRoot().selectEnd()
      },
      // `history-merge` keeps the seed out of the undo stack (so undo can't clear it to empty);
      // focus once the seeded nodes are in the DOM, so the caret lands at the end rather than the start.
      { tag: 'history-merge', onUpdate: () => editor.focus() },
    )
  }, [editor])

  return null
}

function TokenMenu() {
  const [editor] = useLexicalComposerContext()
  const compositeStore = Ariakit.useCompositeStore({ focusLoop: true, focusWrap: true })
  const popoverStore = Ariakit.usePopoverStore({
    placement: 'bottom-end',
    setOpen(open) {
      if (open) {
        compositeStore.move(compositeStore.first())
      }
    },
  })
  const gridStyle = { gridTemplateColumns: `repeat(${TOKENS_BY_CATEGORY.length}, minmax(0, 1fr))` }

  const insertToken = (tokenPointer: TokenPointer) => {
    editor.update(() => {
      const tokenNode = $createTokenNode(tokenPointer)
      const selection = $getSelection()

      // If a token is currently selected, insert right after it.
      if ($isNodeSelection(selection)) {
        const selectedToken = selection.getNodes().find($isTokenNode)
        if (selectedToken) {
          selectedToken.insertAfter(tokenNode)
          tokenNode.selectNext(0, 0)
          return
        }
      }

      // Otherwise insert at the cursor, falling back to the end of the editor when there's no range selection.
      let rangeSelection = selection
      if (!$isRangeSelection(rangeSelection)) {
        $getRoot().selectEnd()
        rangeSelection = $getSelection()
      }
      if ($isRangeSelection(rangeSelection)) {
        rangeSelection.insertNodes([tokenNode])
        tokenNode.selectNext(0, 0)
      }
    })
  }

  return (
    <Ariakit.PopoverProvider store={popoverStore}>
      <Ariakit.PopoverDisclosure
        render={<Button />}
        className={clsx(
          'inline-flex size-8 shrink-0 items-center justify-center rounded-lg',
          'border border-[#E9E9E9] bg-[white]',
        )}
      >
        <Icon legacyName="plus" />
      </Ariakit.PopoverDisclosure>
      <Atoms.DropdownPopover {...Atoms.DROPDOWN_POPOVER_DEFAULTS} render={<Ariakit.Popover />}>
        <Ariakit.CompositeProvider store={compositeStore}>
          <Ariakit.Composite className="flex min-h-0 min-w-0 flex-col gap-1 px-2 py-1 outline-none">
            <div className="grid gap-x-6" style={gridStyle}>
              {TOKENS_BY_CATEGORY.map(({ type, label }) => (
                <div key={type} className="px-2 py-1.5 text-xs font-bold uppercase text-[#949494]">
                  {label}
                </div>
              ))}
            </div>
            {MENU_COLUMNS.map((row, i) => (
              <Ariakit.CompositeRow key={i} className="grid gap-x-6" style={gridStyle}>
                {row.map((tokenDef, j) => {
                  if (!tokenDef) {
                    return <Ariakit.CompositeItem key={`empty-${i}-${j}`} disabled aria-hidden />
                  }

                  return (
                    <Ariakit.CompositeItem
                      key={tokenDef.label}
                      onClick={() =>
                        insertToken({ type: tokenDef.type, code: tokenDef.variants[0].code } as TokenPointer)
                      }
                      className="cursor-pointer rounded px-2 py-1.5 text-left text-sm text-[#0B0B0B] !outline-none hover:bg-[#C2C1C033] data-[active-item]:bg-[#C2C1C033]"
                    >
                      {tokenDef.label}
                    </Ariakit.CompositeItem>
                  )
                })}
              </Ariakit.CompositeRow>
            ))}
          </Ariakit.Composite>
        </Ariakit.CompositeProvider>
      </Atoms.DropdownPopover>
    </Ariakit.PopoverProvider>
  )
}
