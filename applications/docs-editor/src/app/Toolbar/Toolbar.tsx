import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

import { $createCodeNode, $isCodeNode } from '@lexical/code'
import type { ListType } from '@lexical/list'
import {
  $isListNode,
  INSERT_CHECK_LIST_COMMAND,
  INSERT_ORDERED_LIST_COMMAND,
  INSERT_UNORDERED_LIST_COMMAND,
  ListNode,
} from '@lexical/list'
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext'
import { $isDecoratorBlockNode } from '@lexical/react/LexicalDecoratorBlockNode'
import type { HeadingTagType } from '@lexical/rich-text'
import { $createHeadingNode, $createQuoteNode, $isHeadingNode, $isQuoteNode } from '@lexical/rich-text'
import { $getSelectionStyleValueForProperty, $patchStyleText, $setBlocksType } from '@lexical/selection'
import {
  $findMatchingParent,
  $getNearestBlockElementAncestorOrThrow,
  $getNearestNodeOfType,
  mergeRegister,
} from '@lexical/utils'
import type { ElementFormatType } from 'lexical'
import {
  $createParagraphNode,
  $getSelection,
  $isElementNode,
  $isRangeSelection,
  $isRootOrShadowRoot,
  $isTextNode,
  CAN_REDO_COMMAND,
  CAN_UNDO_COMMAND,
  COMMAND_PRIORITY_CRITICAL,
  COMMAND_PRIORITY_NORMAL,
  FORMAT_TEXT_COMMAND,
  INDENT_CONTENT_COMMAND,
  KEY_MODIFIER_COMMAND,
  OUTDENT_CONTENT_COMMAND,
  REDO_COMMAND,
  SELECTION_CHANGE_COMMAND,
  UNDO_COMMAND,
} from 'lexical'

import { getSelectedNode } from '../Utils/getSelectedNode'
import { blockTypeToBlockName } from './BlockTypeToBlockName'
import { DropdownMenu, DropdownMenuButton, Icon, SimpleDropdown } from '@proton/components/components'
import OutdentIcon from '../Icons/OutdentIcon'
import IndentIcon from '../Icons/IndentIcon'
import UndoIcon from '../Icons/UndoIcon'
import RedoIcon from '../Icons/RedoIcon'
import { rootFontSize } from '@proton/shared/lib/helpers/dom'
import { getHTMLElementFontSize } from '../Utils/getHTMLElementFontSize'
import { Button } from '@proton/atoms'
import { INSERT_IMAGE_COMMAND } from '../Plugins/Image/ImagePlugin'
import { $isLinkNode } from '@lexical/link'
import { ToolbarButton } from './ToolbarButton'
import { ToolbarSeparator } from './ToolbarSeparator'
import { c } from 'ttag'
import { useLexicalEditable } from '@lexical/react/useLexicalEditable'
import { EDIT_LINK_COMMAND } from '../Plugins/Link/LinkInfoPlugin'
import CheckListIcon from '../Icons/CheckListIcon'
import clsx from '@proton/utils/clsx'
import { getFontFaceIdFromValue, getFontFaceValueFromId } from '@proton/components/components/editor/helpers/fontFace'
import { DefaultFont, FontOptions, FontSizes } from '../Shared/Fonts'
import { sendErrorMessage } from '../Utils/errorMessage'
import TableIcon from '../Icons/TableIcon'
import { useActiveBreakpoint } from '@proton/components'
import AlignmentMenuOptions, { AlignmentOptions } from './AlignmentMenuOptions'
import type { DocumentInteractionMode } from '../DocumentInteractionMode'
import { INSERT_TABLE_COMMAND } from '../Plugins/Table/InsertTableCommand'
import { FontColorMenu } from '../Components/ColorMenu'
import { BackgroundColors, TextColors } from '../Shared/Color'
import { isMac } from '@proton/shared/lib/helpers/browser'

import './Toolbar.scss'

type BlockType = keyof typeof blockTypeToBlockName

export default function DocumentEditorToolbar({
  onInteractionModeChange,
  hasEditAccess,
}: {
  onInteractionModeChange: (mode: DocumentInteractionMode) => void
  hasEditAccess: boolean
}) {
  const [editor] = useLexicalComposerContext()
  const [activeEditor, setActiveEditor] = useState(editor)

  const isEditable = useLexicalEditable()

  const [canUndo, setCanUndo] = useState(false)
  const [canRedo, setCanRedo] = useState(false)

  const [blockType, setBlockType] = useState<BlockType>('paragraph')
  const [isCodeBlock, setIsCodeBlock] = useState(false)
  const [isQuote, setIsQuote] = useState(false)

  const [listType, setListType] = useState<ListType>()
  const [elementFormat, setElementFormat] = useState<ElementFormatType>('left')

  const [isBold, setIsBold] = useState(false)
  const [isItalic, setIsItalic] = useState(false)
  const [isUnderline, setIsUnderline] = useState(false)
  const [isStrikethrough, setIsStrikethrough] = useState(false)
  const [isLink, setIsLink] = useState(false)

  const defaultFontSize = `${rootFontSize()}px`
  const [fontSize, setFontSize] = useState(defaultFontSize)

  const [fontFamily, setFontFamily] = useState(DefaultFont.id)
  const fontFamilyLabel = useMemo(
    () => FontOptions.find((font) => font.id === fontFamily)?.label || DefaultFont.label,
    [fontFamily],
  )

  const imageInputRef = useRef<HTMLInputElement>(null)

  const focusEditor = useCallback(() => {
    editor.focus()
  }, [editor])

  const undo = () => {
    activeEditor.dispatchCommand(UNDO_COMMAND, undefined)
  }

  const redo = () => {
    activeEditor.dispatchCommand(REDO_COMMAND, undefined)
  }

  const formatBold = () => {
    editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'bold')
    focusEditor()
  }

  const formatItalic = () => {
    editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'italic')
    focusEditor()
  }

  const formatUnderline = () => {
    editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'underline')
    focusEditor()
  }

  const formatStrikethrough = () => {
    editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'strikethrough')
    focusEditor()
  }

  const formatParagraph = () => {
    editor.update(
      () => {
        const selection = $getSelection()
        $setBlocksType(selection, () => $createParagraphNode())
      },
      {
        onUpdate: focusEditor,
      },
    )
  }

  const formatHeading = (headingSize: HeadingTagType) => {
    if (blockType !== headingSize) {
      editor.update(
        () => {
          const selection = $getSelection()
          $setBlocksType(selection, () => $createHeadingNode(headingSize))
          editor.focus()
        },
        {
          onUpdate: focusEditor,
        },
      )
    }
  }

  const formatBulletList = () => {
    if (listType !== 'bullet') {
      editor.dispatchCommand(INSERT_UNORDERED_LIST_COMMAND, undefined)
      focusEditor()
    } else {
      formatParagraph()
    }
  }

  const formatCheckList = () => {
    if (listType !== 'check') {
      editor.dispatchCommand(INSERT_CHECK_LIST_COMMAND, undefined)
      focusEditor()
    } else {
      formatParagraph()
    }
  }

  const formatNumberedList = () => {
    if (listType !== 'number') {
      editor.dispatchCommand(INSERT_ORDERED_LIST_COMMAND, undefined)
      focusEditor()
    } else {
      formatParagraph()
    }
  }

  const formatQuote = () => {
    if (!isQuote) {
      editor.update(
        () => {
          const selection = $getSelection()
          $setBlocksType(selection, () => $createQuoteNode())
        },
        {
          onUpdate: focusEditor,
        },
      )
    } else {
      formatParagraph()
    }
  }

  const formatCode = () => {
    if (!isCodeBlock) {
      editor.update(
        () => {
          const selection = $getSelection()
          $setBlocksType(selection, () => $createCodeNode())
        },
        {
          onUpdate: focusEditor,
        },
      )
    } else {
      formatParagraph()
    }
  }

  const editLink = () => {
    activeEditor.dispatchCommand(EDIT_LINK_COMMAND, undefined)
  }

  const insertImage = () => {
    imageInputRef.current?.click()
  }

  const insertTable = () => {
    activeEditor.dispatchCommand(INSERT_TABLE_COMMAND, {
      rows: '3',
      columns: '3',
      includeHeaders: {
        rows: true,
        columns: false,
      },
      fullWidth: true,
    })
  }

  const $updateToolbar = useCallback(() => {
    const selection = $getSelection()
    if ($isRangeSelection(selection)) {
      const anchorNode = selection.anchor.getNode()
      let element =
        anchorNode.getKey() === 'root'
          ? anchorNode
          : $findMatchingParent(anchorNode, (e) => {
              const parent = e.getParent()
              return parent !== null && $isRootOrShadowRoot(parent)
            })

      if (element === null) {
        element = anchorNode.getTopLevelElementOrThrow()
      }

      const elementKey = element.getKey()
      const elementDOM = activeEditor.getElementByKey(elementKey)

      setIsBold(selection.hasFormat('bold'))
      setIsItalic(selection.hasFormat('italic'))
      setIsUnderline(selection.hasFormat('underline'))
      setIsStrikethrough(selection.hasFormat('strikethrough'))

      const node = getSelectedNode(selection)
      const parent = node.getParent()

      if ($isLinkNode(parent) || $isLinkNode(node)) {
        setIsLink(true)
      } else {
        setIsLink(false)
      }

      if (elementDOM !== null) {
        setBlockType('paragraph')

        if ($isCodeNode(element)) {
          setIsCodeBlock(true)
        } else {
          setIsCodeBlock(false)
        }

        if ($isQuoteNode(element)) {
          setIsQuote(true)
        } else {
          setIsQuote(false)
        }

        if ($isHeadingNode(element)) {
          const tag = element.getTag()
          setBlockType(tag)
        }

        if ($isListNode(element)) {
          const parentList = $getNearestNodeOfType<ListNode>(anchorNode, ListNode)
          const type = parentList ? parentList.getListType() : element.getListType()
          setListType(type)
        } else {
          setListType(undefined)
        }
      }

      const defaultFontSizeValue = elementDOM ? `${getHTMLElementFontSize(elementDOM)}px` : defaultFontSize
      setFontSize($getSelectionStyleValueForProperty(selection, 'font-size', defaultFontSizeValue))

      const fontFamilyValue = $getSelectionStyleValueForProperty(selection, 'font-family', 'Arial')
      const fontFamilyId = getFontFaceIdFromValue(fontFamilyValue)
      if (fontFamilyId) {
        setFontFamily(fontFamilyId)
      } else {
        setFontFamily('Arial')
      }

      const elementFormat = $isElementNode(node) ? node.getFormatType() : parent?.getFormatType()
      setElementFormat(elementFormat || 'left')
    }
  }, [activeEditor, defaultFontSize])

  useEffect(() => {
    return editor.registerCommand(
      SELECTION_CHANGE_COMMAND,
      (_payload, newEditor) => {
        $updateToolbar()
        setActiveEditor(newEditor)
        return false
      },
      COMMAND_PRIORITY_CRITICAL,
    )
  }, [$updateToolbar, editor])

  useEffect(() => {
    return mergeRegister(
      activeEditor.registerUpdateListener(({ editorState }) => {
        editorState.read(() => {
          $updateToolbar()
        })
      }),
      activeEditor.registerCommand<boolean>(
        CAN_UNDO_COMMAND,
        (payload) => {
          setCanUndo(payload)
          return false
        },
        COMMAND_PRIORITY_CRITICAL,
      ),
      activeEditor.registerCommand<boolean>(
        CAN_REDO_COMMAND,
        (payload) => {
          setCanRedo(payload)
          return false
        },
        COMMAND_PRIORITY_CRITICAL,
      ),
      activeEditor.registerCommand(
        KEY_MODIFIER_COMMAND,
        (event) => {
          const { key, ctrlKey, metaKey } = event
          const hasModifier = isMac() ? metaKey : ctrlKey
          if (key === 'k' && hasModifier) {
            event.preventDefault()
            return activeEditor.dispatchCommand(EDIT_LINK_COMMAND, undefined)
          }
          return false
        },
        COMMAND_PRIORITY_NORMAL,
      ),
    )
  }, [$updateToolbar, activeEditor])

  const setFontSizeForSelection = useCallback(
    (newFontSize: string) => {
      activeEditor.update(() => {
        if (activeEditor.isEditable()) {
          const selection = $getSelection()
          if (selection !== null) {
            $patchStyleText(selection, {
              'font-size': newFontSize,
            })
          }
        }
      })
    },
    [activeEditor],
  )

  const clearFormatting = useCallback(() => {
    activeEditor.update(() => {
      const selection = $getSelection()
      if ($isRangeSelection(selection)) {
        const anchor = selection.anchor
        const focus = selection.focus
        const nodes = selection.getNodes()

        if (anchor.key === focus.key && anchor.offset === focus.offset) {
          return
        }

        nodes.forEach((node, idx) => {
          // We split the first and last node by the selection
          // So that we don't format unselected text inside those nodes
          if ($isTextNode(node)) {
            // Use a separate variable to ensure TS does not lose the refinement
            let textNode = node
            if (idx === 0 && anchor.offset !== 0) {
              textNode = textNode.splitText(anchor.offset)[1] || textNode
            }
            if (idx === nodes.length - 1) {
              textNode = textNode.splitText(focus.offset)[0] || textNode
            }

            if (textNode.__style !== '') {
              textNode.setStyle('')
            }
            if (textNode.__format !== 0) {
              textNode.setFormat(0)
              $getNearestBlockElementAncestorOrThrow(textNode).setFormat('')
            }
            node = textNode
          } else if ($isHeadingNode(node) || $isQuoteNode(node)) {
            node.replace($createParagraphNode(), true)
          } else if ($isDecoratorBlockNode(node)) {
            node.setFormat('')
          }
        })
      }
    })
  }, [activeEditor])

  const blockTypes: {
    type: BlockType
    name: string
    onClick: () => void
  }[] = [
    {
      type: 'paragraph',
      name: blockTypeToBlockName.paragraph,
      onClick: formatParagraph,
    },
    {
      type: 'h1',
      name: blockTypeToBlockName.h1,
      onClick: () => formatHeading('h1'),
    },
    {
      type: 'h2',
      name: blockTypeToBlockName.h2,
      onClick: () => formatHeading('h2'),
    },
    {
      type: 'h3',
      name: blockTypeToBlockName.h3,
      onClick: () => formatHeading('h3'),
    },
    {
      type: 'h4',
      name: blockTypeToBlockName.h4,
      onClick: () => formatHeading('h4'),
    },
  ]

  const listTypes = [
    {
      type: 'check',
      icon: <CheckListIcon className="h-4 w-4 fill-current" />,
      name: 'Check List',
      onClick: formatCheckList,
    },
    {
      type: 'bullet',
      icon: <Icon name="list-bullets" />,
      name: 'Bulleted List',
      onClick: formatBulletList,
    },
    {
      type: 'number',
      icon: <Icon name="list-numbers" />,
      name: 'Numbered List',
      onClick: formatNumberedList,
    },
  ]

  const setFontFamilyForSelection = useCallback(
    (id: string) => {
      const value = getFontFaceValueFromId(id)
      if (!value) {
        return
      }
      activeEditor.update(() => {
        const selection = $getSelection()
        if (selection !== null) {
          $patchStyleText(selection, {
            'font-family': value,
          })
        }
      })
    },
    [activeEditor],
  )

  const applyStyleText = useCallback(
    (styles: Record<string, string>, skipHistoryStack?: boolean) => {
      activeEditor.update(
        () => {
          const selection = $getSelection()
          if (selection !== null) {
            $patchStyleText(selection, styles)
          }
        },
        skipHistoryStack ? { tag: 'historic' } : {},
      )
    },
    [activeEditor],
  )

  const { viewportWidth } = useActiveBreakpoint()
  const viewportMoreThanLarge = viewportWidth['2xlarge'] || viewportWidth.xlarge

  const showUndoRedoInToolbar = !viewportWidth['<=medium']
  const showTextFormattingOptionsInToolbar = !viewportWidth['<=small']
  const showAlignmentOptionsInToolbar = !viewportWidth['<=medium']
  const showListTypeOptionsInToolbar = !viewportWidth['<=medium']
  const showCodeAndQuoteOptionsInToolbar = !viewportWidth['<=medium']
  const showInsertOptionsInToolbar = viewportMoreThanLarge

  const DropdownContentProps = {
    onClosed: () => {
      const activeElement = document.activeElement
      const rootElementParent = editor.getRootElement()?.parentElement
      if (!rootElementParent || rootElementParent.contains(activeElement)) {
        return
      }
      focusEditor()
    },
  }

  return (
    <div
      className="bg-norm z-1 flex flex-nowrap items-center gap-1.5 print:hidden"
      style={{
        gridColumn: '1 / 3',
        gridRow: '1',
        scrollbarWidth: 'thin',
      }}
    >
      <div
        className="DocumentEditorToolbar bg-norm flex w-full flex-nowrap items-center gap-1.5 overflow-auto px-3 py-1.5 md:mx-auto md:max-w-max md:[border-radius:1rem]"
        data-testid="main-toolbar"
      >
        {showUndoRedoInToolbar && (
          <>
            <ToolbarButton
              label={c('Action').t`Undo`}
              onClick={undo}
              disabled={!isEditable || !canUndo}
              data-testid="undo-button"
            >
              <UndoIcon className="h-4 w-4 fill-current" />
            </ToolbarButton>
            <ToolbarButton
              label={c('Action').t`Redo`}
              onClick={redo}
              disabled={!isEditable || !canRedo}
              data-testid="redo-button"
            >
              <RedoIcon className="h-4 w-4 fill-current" />
            </ToolbarButton>
            <ToolbarSeparator />
          </>
        )}
        <SimpleDropdown
          as={Button}
          shape="ghost"
          type="button"
          color="norm"
          className="px-2 text-left text-sm"
          content={
            <span
              className="w-custom line-clamp-1 break-all"
              style={{
                '--w-custom': '9ch',
              }}
            >
              {blockTypeToBlockName[blockType]}
            </span>
          }
          disabled={!isEditable}
          contentProps={DropdownContentProps}
          data-testid="headings-options"
        >
          <DropdownMenu>
            {blockTypes.map(({ type, name, onClick }) => (
              <DropdownMenuButton key={type} className="text-left text-sm" onClick={onClick} disabled={!isEditable}>
                {name}
              </DropdownMenuButton>
            ))}
          </DropdownMenu>
        </SimpleDropdown>
        <SimpleDropdown
          as={Button}
          shape="ghost"
          type="button"
          color="norm"
          className="px-2 text-left text-sm"
          content={
            <span
              className="w-custom line-clamp-1 break-all"
              style={{
                '--w-custom': '7ch',
              }}
            >
              {fontFamilyLabel}
            </span>
          }
          disabled={!isEditable}
          contentProps={DropdownContentProps}
          data-testid="font-family"
        >
          <DropdownMenu>
            {FontOptions.map(({ id, label, value }) => (
              <DropdownMenuButton
                key={id}
                className="text-left text-sm"
                style={{
                  fontFamily: value,
                }}
                onClick={() => {
                  setFontFamilyForSelection(id)
                }}
                disabled={!isEditable}
                data-testid="font-family-options"
              >
                {label}
              </DropdownMenuButton>
            ))}
          </DropdownMenu>
        </SimpleDropdown>
        <ToolbarSeparator />
        <SimpleDropdown
          as={Button}
          shape="ghost"
          type="button"
          color="norm"
          className="px-2 text-left text-sm"
          content={fontSize}
          disabled={!isEditable}
          contentProps={DropdownContentProps}
          data-testid="font-size"
        >
          <DropdownMenu>
            {FontSizes.map((size) => (
              <DropdownMenuButton
                key={size}
                className="text-left text-sm"
                onClick={() => {
                  const clampedValue = Math.min(100, Math.max(4, size))
                  setFontSizeForSelection(`${clampedValue}px`)
                }}
                disabled={!isEditable}
                data-testid="font-size-options"
              >
                {size}px
              </DropdownMenuButton>
            ))}
          </DropdownMenu>
        </SimpleDropdown>
        <ToolbarSeparator />
        {showTextFormattingOptionsInToolbar && (
          <>
            <ToolbarButton
              label={c('Action').t`Bold`}
              disabled={!isEditable}
              active={isBold}
              onClick={formatBold}
              data-testid="bold-button"
            >
              <Icon name="text-bold" />
            </ToolbarButton>
            <ToolbarButton
              label={c('Action').t`Italic`}
              disabled={!isEditable}
              active={isItalic}
              onClick={formatItalic}
              data-testid="italic-button"
            >
              <Icon name="text-italic" />
            </ToolbarButton>
            <ToolbarButton
              label={c('Action').t`Underline`}
              disabled={!isEditable}
              active={isUnderline}
              onClick={formatUnderline}
              data-testid="underline-button"
            >
              <Icon name="text-underline" />
            </ToolbarButton>
            <ToolbarButton
              label={c('Action').t`Strikethrough`}
              disabled={!isEditable}
              active={isStrikethrough}
              onClick={formatStrikethrough}
              data-testid="strikethrough-button"
            >
              <Icon name="text-strikethrough" />
            </ToolbarButton>
            <SimpleDropdown
              as={ToolbarButton}
              shape="ghost"
              type="button"
              className="text-[--text-norm]"
              content={<Icon name="palette" />}
              disabled={!isEditable}
              contentProps={DropdownContentProps}
              data-testid="font-color-dropdown"
            >
              <FontColorMenu
                textColors={TextColors}
                onTextColorChange={(color) => applyStyleText({ color })}
                backgroundColors={BackgroundColors}
                onBackgroundColorChange={(color) => applyStyleText({ 'background-color': color || '' })}
              />
            </SimpleDropdown>
            <ToolbarSeparator />
          </>
        )}
        {showAlignmentOptionsInToolbar && (
          <>
            <SimpleDropdown
              as={ToolbarButton}
              active={elementFormat !== 'left'}
              shape="ghost"
              type="button"
              className="text-[--text-norm]"
              content={
                AlignmentOptions.find(({ align }) => align === elementFormat)?.icon || <Icon name="text-align-left" />
              }
              disabled={!isEditable}
              contentProps={DropdownContentProps}
              data-testid="alignment-button"
            >
              <DropdownMenu>
                <AlignmentMenuOptions
                  activeEditor={activeEditor}
                  elementFormat={elementFormat}
                  isEditable={isEditable}
                />
              </DropdownMenu>
            </SimpleDropdown>
            <ToolbarSeparator />
          </>
        )}
        {showListTypeOptionsInToolbar && (
          <>
            <SimpleDropdown
              as={ToolbarButton}
              active={listTypes.some(({ type }) => type === listType)}
              shape="ghost"
              type="button"
              className="text-[--text-norm]"
              content={
                listTypes.find(({ type }) => type === listType)?.icon || (
                  <CheckListIcon className="h-4 w-4 fill-current" />
                )
              }
              disabled={!isEditable}
              contentProps={DropdownContentProps}
              data-testid="list-types-dropdown"
            >
              <DropdownMenu>
                {listTypes.map(({ type, icon, name, onClick }) => (
                  <DropdownMenuButton
                    key={type}
                    className={clsx(
                      'flex items-center gap-2 text-left text-sm',
                      type === listType && 'active font-bold',
                    )}
                    onClick={onClick}
                    disabled={!isEditable}
                  >
                    {icon}
                    {name}
                  </DropdownMenuButton>
                ))}
              </DropdownMenu>
            </SimpleDropdown>
            <ToolbarSeparator />
          </>
        )}
        <input
          ref={imageInputRef}
          className="absolute left-0 top-0 h-px w-px opacity-0"
          type="file"
          accept="image/*"
          onChange={async (event: React.ChangeEvent<HTMLInputElement>) => {
            try {
              if (!event.target.files || event.target.files.length !== 1) {
                return
              }

              if (!isEditable) {
                return
              }

              const file = event.target.files[0]
              activeEditor.dispatchCommand(INSERT_IMAGE_COMMAND, file)
            } catch (error: unknown) {
              sendErrorMessage(error)
            } finally {
              imageInputRef.current!.value = ''
            }
          }}
          data-testid="image-input"
        />
        {showCodeAndQuoteOptionsInToolbar && (
          <>
            <ToolbarButton
              label={c('Action').t`Code block`}
              active={isCodeBlock}
              disabled={!isEditable}
              onClick={formatCode}
              data-testid="code-block-button"
            >
              <Icon name="code" />
            </ToolbarButton>
            <ToolbarButton
              label={c('Action').t`Quote`}
              active={isQuote}
              disabled={!isEditable}
              onClick={formatQuote}
              data-testid="quote-button"
            >
              <Icon name="text-quote" />
            </ToolbarButton>
            <ToolbarSeparator />
          </>
        )}
        {showInsertOptionsInToolbar && (
          <>
            <ToolbarButton
              label={c('Action').t`Link`}
              disabled={!isEditable}
              active={isLink}
              onClick={editLink}
              data-testid="link-button"
            >
              <Icon name="link" className="h-4 w-4 fill-current" />
            </ToolbarButton>
            <ToolbarButton
              label={c('Action').t`Insert image`}
              disabled={!isEditable}
              onClick={insertImage}
              data-testid="image-insert-button"
            >
              <Icon name="image" className="h-4 w-4 fill-current" />
            </ToolbarButton>
            <ToolbarButton
              label={c('Action').t`Insert table`}
              disabled={!isEditable}
              onClick={insertTable}
              data-testid="table-button"
            >
              <TableIcon className="h-4 w-4 fill-current" />
            </ToolbarButton>
            <ToolbarSeparator />
          </>
        )}
        <SimpleDropdown
          as={ToolbarButton}
          shape="ghost"
          type="button"
          className="text-[--text-norm]"
          content={<Icon name="three-dots-vertical" />}
          disabled={!isEditable}
          hasCaret={false}
          contentProps={DropdownContentProps}
          data-testid="content-properties-button"
        >
          <DropdownMenu className="[&>li>hr]:min-h-px">
            {!showUndoRedoInToolbar && (
              <>
                <DropdownMenuButton
                  className="flex items-center gap-2 text-left text-sm"
                  onClick={undo}
                  disabled={!isEditable || !canUndo}
                >
                  <UndoIcon className="h-4 w-4 fill-current" />
                  {c('Action').t`Undo`}
                </DropdownMenuButton>
                <DropdownMenuButton
                  className="flex items-center gap-2 text-left text-sm"
                  onClick={redo}
                  disabled={!isEditable || !canRedo}
                >
                  <RedoIcon className="h-4 w-4 fill-current" />
                  {c('Action').t`Redo`}
                </DropdownMenuButton>
                <hr className="my-1" />
              </>
            )}
            <DropdownMenuButton
              className="flex items-center gap-2 text-left text-sm"
              disabled={!isEditable}
              onClick={() => {
                activeEditor.dispatchCommand(INDENT_CONTENT_COMMAND, undefined)
              }}
              data-testid="indent-dropdown"
            >
              <IndentIcon className="h-4 w-4 fill-current" />
              {c('Action').t`Indent`}
            </DropdownMenuButton>
            <DropdownMenuButton
              className="flex items-center gap-2 text-left text-sm"
              disabled={!isEditable}
              onClick={() => {
                activeEditor.dispatchCommand(OUTDENT_CONTENT_COMMAND, undefined)
              }}
              data-testid="outdent-dropdown"
            >
              <OutdentIcon className="h-4 w-4 fill-current" />
              {c('Action').t`Outdent`}
            </DropdownMenuButton>
            {!showAlignmentOptionsInToolbar && (
              <>
                <hr className="my-1" />
                <AlignmentMenuOptions
                  activeEditor={activeEditor}
                  elementFormat={elementFormat}
                  isEditable={isEditable}
                />
              </>
            )}
            {!showInsertOptionsInToolbar && (
              <>
                <hr className="my-1" />
                <DropdownMenuButton
                  className="flex items-center gap-2 text-left text-sm"
                  onClick={insertImage}
                  disabled={!isEditable}
                >
                  <Icon name="image" />
                  {c('Action').t`Insert image`}
                </DropdownMenuButton>
                <DropdownMenuButton
                  className="flex items-center gap-2 text-left text-sm"
                  onClick={editLink}
                  disabled={!isEditable}
                >
                  <Icon name="link" />
                  {c('Action').t`Link`}
                </DropdownMenuButton>
                <DropdownMenuButton
                  className="flex items-center gap-2 text-left text-sm"
                  onClick={insertTable}
                  disabled={!isEditable}
                >
                  <TableIcon className="h-4 w-4 fill-current" />
                  {c('Action').t`Insert table`}
                </DropdownMenuButton>
              </>
            )}
            {!showListTypeOptionsInToolbar && (
              <>
                <hr className="my-1" />
                {listTypes.map(({ type, icon, name, onClick }) => (
                  <DropdownMenuButton
                    key={type}
                    className={clsx(
                      'flex items-center gap-2 text-left text-sm',
                      type === listType && 'active font-bold',
                    )}
                    onClick={onClick}
                    disabled={!isEditable}
                  >
                    {icon}
                    {name}
                  </DropdownMenuButton>
                ))}
              </>
            )}
            {!showTextFormattingOptionsInToolbar && (
              <>
                <hr className="my-1" />
                <DropdownMenuButton
                  className="flex items-center gap-2 text-left text-sm"
                  onClick={formatBold}
                  disabled={!isEditable}
                >
                  <Icon name="text-bold" />
                  {c('Action').t`Bold`}
                </DropdownMenuButton>
                <DropdownMenuButton
                  className="flex items-center gap-2 text-left text-sm"
                  onClick={formatItalic}
                  disabled={!isEditable}
                >
                  <Icon name="text-italic" />
                  {c('Action').t`Italic`}
                </DropdownMenuButton>
                <DropdownMenuButton
                  className="flex items-center gap-2 text-left text-sm"
                  onClick={formatUnderline}
                  disabled={!isEditable}
                >
                  <Icon name="text-underline" />
                  {c('Action').t`Underline`}
                </DropdownMenuButton>
                <DropdownMenuButton
                  className="flex items-center gap-2 text-left text-sm"
                  onClick={formatStrikethrough}
                  disabled={!isEditable}
                >
                  <Icon name="text-strikethrough" />
                  {c('Action').t`Strikethrough`}
                </DropdownMenuButton>
              </>
            )}
            {!showCodeAndQuoteOptionsInToolbar && (
              <>
                <hr className="my-1" />
                <DropdownMenuButton
                  className="flex items-center gap-2 text-left text-sm"
                  onClick={formatCode}
                  disabled={!isEditable}
                >
                  <Icon name="code" />
                  {c('Action').t`Code block`}
                </DropdownMenuButton>
                <DropdownMenuButton
                  className="flex items-center gap-2 text-left text-sm"
                  onClick={formatQuote}
                  disabled={!isEditable}
                >
                  <Icon name="text-quote" />
                  {c('Action').t`Quote`}
                </DropdownMenuButton>
              </>
            )}
            <hr className="my-1" />
            <DropdownMenuButton
              className="flex items-center gap-2 text-left text-sm"
              disabled={!isEditable}
              onClick={clearFormatting}
              data-testid="clear-formatting-button"
            >
              <Icon name="eraser" />
              {c('Action').t`Clear formatting`}
            </DropdownMenuButton>
          </DropdownMenu>
        </SimpleDropdown>
        <SimpleDropdown
          as={Button}
          shape="solid"
          type="button"
          className="ml-auto flex gap-2 py-2"
          style={{
            border: '0',
          }}
          caretClassName="-ml-1"
          content={<>{isEditable ? <Icon name="pencil" /> : <Icon name="eye" />}</>}
          hasCaret={!viewportWidth['<=small']}
          contentProps={DropdownContentProps}
          data-testid="edit-options-dropdown"
        >
          <DropdownMenu>
            {hasEditAccess && (
              <DropdownMenuButton
                className="flex items-center gap-2 text-left text-sm"
                onClick={() => {
                  onInteractionModeChange('edit')
                }}
                data-testid="edit-dropdown-button"
              >
                <Icon name="pencil" size={4.5} />
                {c('Info').t`Editing`}
              </DropdownMenuButton>
            )}
            <DropdownMenuButton
              className="flex items-center gap-2 text-left text-sm"
              onClick={() => {
                onInteractionModeChange('view')
              }}
              data-testid="view-dropdown-button"
            >
              <Icon name="eye" size={4.5} />
              {c('Info').t`Viewing`}
            </DropdownMenuButton>
          </DropdownMenu>
        </SimpleDropdown>
      </div>
    </div>
  )
}
