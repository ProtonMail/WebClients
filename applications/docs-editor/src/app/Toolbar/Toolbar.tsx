import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

import { $createCodeNode, $isCodeNode } from '@lexical/code'
import {
  $isListNode,
  INSERT_CHECK_LIST_COMMAND,
  INSERT_ORDERED_LIST_COMMAND,
  INSERT_UNORDERED_LIST_COMMAND,
  ListNode,
  ListType,
} from '@lexical/list'
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext'
import { $isDecoratorBlockNode } from '@lexical/react/LexicalDecoratorBlockNode'
import { $createHeadingNode, $createQuoteNode, $isHeadingNode, $isQuoteNode, HeadingTagType } from '@lexical/rich-text'
import { $getSelectionStyleValueForProperty, $patchStyleText, $setBlocksType } from '@lexical/selection'
import {
  $findMatchingParent,
  $getNearestBlockElementAncestorOrThrow,
  $getNearestNodeOfType,
  mergeRegister,
} from '@lexical/utils'
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
  ElementFormatType,
  FORMAT_ELEMENT_COMMAND,
  FORMAT_TEXT_COMMAND,
  INDENT_CONTENT_COMMAND,
  OUTDENT_CONTENT_COMMAND,
  REDO_COMMAND,
  SELECTION_CHANGE_COMMAND,
  UNDO_COMMAND,
} from 'lexical'

import { getSelectedNode } from '../Utils/getSelectedNode'
import { blockTypeToBlockName } from '../BlockTypeToBlockName'
import { DropdownMenu, DropdownMenuButton, Icon, SimpleDropdown } from '@proton/components/components'
import AlignLeftIcon from '../Icons/AlignLeftIcon'
import AlignCenterIcon from '../Icons/AlignCenterIcon'
import AlignJustifyIcon from '../Icons/AlignJustifyIcon'
import AlignRightIcon from '../Icons/AlignRightIcon'
import OutdentIcon from '../Icons/OutdentIcon'
import IndentIcon from '../Icons/IndentIcon'
import BoldIcon from '../Icons/BoldIcon'
import ItalicIcon from '../Icons/ItalicIcon'
import UnderlineIcon from '../Icons/UnderlineIcon'
import UndoIcon from '../Icons/UndoIcon'
import RedoIcon from '../Icons/RedoIcon'
import { rootFontSize } from '@proton/shared/lib/helpers/dom'
import { getHTMLElementFontSize } from '../Utils/getHTMLElementFontSize'
import { Button } from '@proton/atoms'
import { INSERT_IMAGE_COMMAND } from '../Plugins/Image/ImagePlugin'
import { $isLinkNode } from '@lexical/link'
import { useInternalEventBus } from '../InternalEventBusProvider'
import { EditorEditableChangeEvent } from '@proton/docs-shared'
import { ToolbarButton } from './ToolbarButton'
import { ToolbarSeparator } from './ToolbarSeparator'
import { TableOption } from './TableOption'
import { c } from 'ttag'
import { useLexicalEditable } from '@lexical/react/useLexicalEditable'
import { EDIT_LINK_COMMAND } from '../Plugins/Link/LinkInfoPlugin'
import CheckListIcon from '../Icons/CheckListIcon'
import clsx from '@proton/utils/clsx'
import { getFontFaceIdFromValue, getFontFaceValueFromId } from '@proton/components/components/editor/helpers/fontFace'
import { DefaultFont, FontOptions } from '../Shared/Fonts'
import { sendErrorMessage } from '../Utils/errorMessage'

type BlockType = keyof typeof blockTypeToBlockName

export default function DocumentEditorToolbar() {
  const eventBus = useInternalEventBus()
  const [editor] = useLexicalComposerContext()
  const [activeEditor, setActiveEditor] = useState(editor)

  const isEditable = useLexicalEditable()

  const [canUndo, setCanUndo] = useState(false)
  const [canRedo, setCanRedo] = useState(false)

  const [blockType, setBlockType] = useState<BlockType>('paragraph')
  const [listType, setListType] = useState<ListType>()
  const [elementFormat, setElementFormat] = useState<ElementFormatType>('left')

  const [isBold, setIsBold] = useState(false)
  const [isItalic, setIsItalic] = useState(false)
  const [isUnderline, setIsUnderline] = useState(false)
  const [isLink, setIsLink] = useState(false)

  const defaultFontSize = `${rootFontSize()}px`
  const [fontSize, setFontSize] = useState(defaultFontSize)
  const [inputFontSize, setInputFontSize] = useState(fontSize.slice(0, -2))
  useEffect(() => {
    setInputFontSize(fontSize.slice(0, -2))
  }, [fontSize])

  const [fontFamily, setFontFamily] = useState(DefaultFont.id)
  const fontFamilyLabel = useMemo(
    () => FontOptions.find((font) => font.id === fontFamily)?.label || DefaultFont.label,
    [fontFamily],
  )

  const imageInputRef = useRef<HTMLInputElement>(null)

  const focusEditor = useCallback(() => {
    editor.focus()
  }, [editor])

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
    if (blockType !== 'quote') {
      editor.update(
        () => {
          const selection = $getSelection()
          $setBlocksType(selection, () => $createQuoteNode())
        },
        {
          onUpdate: focusEditor,
        },
      )
    }
  }

  const formatCode = () => {
    if (blockType !== 'code') {
      editor.update(
        () => {
          let selection = $getSelection()

          if (selection !== null) {
            if (selection.isCollapsed()) {
              $setBlocksType(selection, () => $createCodeNode())
            } else {
              const textContent = selection.getTextContent()
              const codeNode = $createCodeNode()
              selection.insertNodes([codeNode])
              selection = $getSelection()
              if ($isRangeSelection(selection)) {
                selection.insertRawText(textContent)
              }
            }
          }
        },
        {
          onUpdate: focusEditor,
        },
      )
    }
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

      const node = getSelectedNode(selection)
      const parent = node.getParent()

      if ($isLinkNode(parent) || $isLinkNode(node)) {
        setIsLink(true)
      } else {
        setIsLink(false)
      }

      if (elementDOM !== null) {
        if ($isListNode(element)) {
          const parentList = $getNearestNodeOfType<ListNode>(anchorNode, ListNode)
          const type = parentList ? parentList.getListType() : element.getListType()
          setListType(type)
          setBlockType('paragraph')
        } else {
          setListType(undefined)
          const type = $isHeadingNode(element) ? element.getTag() : element.getType()
          if (type in blockTypeToBlockName) {
            setBlockType(type as BlockType)
          }
          if ($isCodeNode(element)) {
            return
          }
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

      setElementFormat($isElementNode(node) ? node.getFormatType() : parent?.getFormatType() || 'left')
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
      type: 'quote',
      name: blockTypeToBlockName.quote,
      onClick: formatQuote,
    },
    {
      type: 'code',
      name: blockTypeToBlockName.code,
      onClick: formatCode,
    },
  ]

  const checkListTypes = [
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

  return (
    <div className="flex items-center gap-1.5 overflow-auto border-y border-[--border-weak] bg-[--background-norm] px-3 py-1.5 [grid-column:1_/_3] [grid-row:1] [scrollbar-width:thin]">
      <div className="mx-auto flex max-w-max items-center gap-1.5">
        <ToolbarButton
          label={c('Action').t`Undo`}
          onClick={() => {
            activeEditor.dispatchCommand(UNDO_COMMAND, undefined)
          }}
          disabled={!isEditable || !canUndo}
        >
          <UndoIcon className="h-4 w-4 fill-current" />
        </ToolbarButton>
        <ToolbarButton
          label={c('Action').t`Redo`}
          onClick={() => {
            if (!isEditable) {
              return
            }
            activeEditor.dispatchCommand(REDO_COMMAND, undefined)
          }}
          disabled={!isEditable || !canRedo}
        >
          <RedoIcon className="h-4 w-4 fill-current" />
        </ToolbarButton>
        <ToolbarSeparator />
        <SimpleDropdown
          as={Button}
          shape="ghost"
          size="small"
          type="button"
          color="norm"
          className="color-norm text-sm"
          content={<>{blockTypeToBlockName[blockType]}</>}
          disabled={!isEditable}
        >
          <DropdownMenu>
            {blockTypes.map(({ type, name, onClick }) => (
              <DropdownMenuButton key={type} className="text-left" onClick={onClick} disabled={!isEditable}>
                {name}
              </DropdownMenuButton>
            ))}
          </DropdownMenu>
        </SimpleDropdown>
        <SimpleDropdown
          as={Button}
          shape="ghost"
          size="small"
          type="button"
          color="norm"
          className="color-norm text-sm"
          content={<>{fontFamilyLabel}</>}
          disabled={!isEditable}
        >
          <DropdownMenu>
            {FontOptions.map(({ id, label, value }) => (
              <DropdownMenuButton
                key={id}
                className="text-left"
                style={{
                  fontFamily: value,
                }}
                onClick={() => {
                  setFontFamilyForSelection(id)
                }}
                disabled={!isEditable}
              >
                {label}
              </DropdownMenuButton>
            ))}
          </DropdownMenu>
        </SimpleDropdown>
        <ToolbarSeparator />
        <ToolbarButton
          label={c('Action').t`Decrease font size`}
          disabled={!isEditable}
          onClick={() => {
            const currentFontSize = parseInt(fontSize)
            const newFontSize = Math.max(4, currentFontSize - 1)
            setFontSizeForSelection(`${newFontSize}px`)
          }}
        >
          <Icon name="minus" className="h-4 w-4 fill-current" />
        </ToolbarButton>
        <input
          className="max-w-[5ch] rounded-lg p-2 text-sm disabled:opacity-50"
          type="number"
          disabled={!isEditable}
          value={inputFontSize}
          onChange={(event) => {
            setInputFontSize(event.target.value)
          }}
          onKeyDown={(event) => {
            const { key } = event
            if (key !== 'Enter') {
              return
            }
            event.preventDefault()
            const clampedValue = Math.min(100, Math.max(4, parseInt(inputFontSize)))
            setFontSizeForSelection(`${clampedValue}px`)
          }}
          onBlur={() => {
            const clampedValue = Math.min(100, Math.max(4, parseInt(inputFontSize)))
            const newValue = `${clampedValue}px`
            if (newValue !== fontSize) {
              setFontSizeForSelection(newValue)
            }
          }}
        />
        <ToolbarButton
          label={c('Action').t`Increase font size`}
          disabled={!isEditable}
          onClick={() => {
            const currentFontSize = parseInt(fontSize)
            const newFontSize = Math.min(100, currentFontSize + 1)
            setFontSizeForSelection(`${newFontSize}px`)
          }}
        >
          <Icon name="plus" className="h-4 w-4 fill-current" />
        </ToolbarButton>
        <ToolbarSeparator />
        <ToolbarButton
          label={c('Action').t`Bold`}
          disabled={!isEditable}
          active={isBold}
          onClick={() => {
            activeEditor.dispatchCommand(FORMAT_TEXT_COMMAND, 'bold')
          }}
        >
          <BoldIcon className="h-4 w-4 fill-current" />
        </ToolbarButton>
        <ToolbarButton
          label={c('Action').t`Italic`}
          disabled={!isEditable}
          active={isItalic}
          onClick={() => {
            activeEditor.dispatchCommand(FORMAT_TEXT_COMMAND, 'italic')
          }}
        >
          <ItalicIcon className="h-4 w-4 fill-current" />
        </ToolbarButton>
        <ToolbarButton
          label={c('Action').t`Underline`}
          disabled={!isEditable}
          active={isUnderline}
          onClick={() => {
            activeEditor.dispatchCommand(FORMAT_TEXT_COMMAND, 'underline')
          }}
        >
          <UnderlineIcon className="h-4 w-4 fill-current" />
        </ToolbarButton>
        <ToolbarButton
          label={c('Action').t`Link`}
          disabled={!isEditable}
          active={isLink}
          onClick={() => {
            activeEditor.dispatchCommand(EDIT_LINK_COMMAND, undefined)
          }}
        >
          <Icon name="link" className="h-4 w-4 fill-current" />
        </ToolbarButton>
        <ToolbarSeparator />
        <ToolbarButton
          label={c('Action').t`Left align`}
          disabled={!isEditable}
          active={elementFormat === 'left'}
          onClick={() => {
            activeEditor.dispatchCommand(FORMAT_ELEMENT_COMMAND, 'left')
          }}
        >
          <AlignLeftIcon className="h-4 w-4 fill-current" />
        </ToolbarButton>
        <ToolbarButton
          label={c('Action').t`Center align`}
          disabled={!isEditable}
          active={elementFormat === 'center'}
          onClick={() => {
            activeEditor.dispatchCommand(FORMAT_ELEMENT_COMMAND, 'center')
          }}
        >
          <AlignCenterIcon className="h-4 w-4 fill-current" />
        </ToolbarButton>
        <ToolbarButton
          label={c('Action').t`Right align`}
          disabled={!isEditable}
          active={elementFormat === 'right'}
          onClick={() => {
            activeEditor.dispatchCommand(FORMAT_ELEMENT_COMMAND, 'right')
          }}
        >
          <AlignRightIcon className="h-4 w-4 fill-current" />
        </ToolbarButton>
        <ToolbarButton
          label={c('Action').t`Justify align`}
          disabled={!isEditable}
          active={elementFormat === 'justify'}
          onClick={() => {
            activeEditor.dispatchCommand(FORMAT_ELEMENT_COMMAND, 'justify')
          }}
        >
          <AlignJustifyIcon className="h-4 w-4 fill-current" />
        </ToolbarButton>
        <ToolbarSeparator />
        <ToolbarButton
          label={c('Action').t`Indent`}
          disabled={!isEditable}
          onClick={() => {
            activeEditor.dispatchCommand(INDENT_CONTENT_COMMAND, undefined)
          }}
        >
          <IndentIcon className="h-4 w-4 fill-current" />
        </ToolbarButton>
        <ToolbarButton
          label={c('Action').t`Outdent`}
          disabled={!isEditable}
          onClick={() => {
            activeEditor.dispatchCommand(OUTDENT_CONTENT_COMMAND, undefined)
          }}
        >
          <OutdentIcon className="h-4 w-4 fill-current" />
        </ToolbarButton>
        <ToolbarSeparator />
        <SimpleDropdown
          as={ToolbarButton}
          active={checkListTypes.some(({ type }) => type === listType)}
          shape="ghost"
          type="button"
          className="text-[--text-norm]"
          content={
            checkListTypes.find(({ type }) => type === listType)?.icon || (
              <CheckListIcon className="h-4 w-4 fill-current" />
            )
          }
          disabled={!isEditable}
        >
          <DropdownMenu>
            {checkListTypes.map(({ type, icon, name, onClick }) => (
              <DropdownMenuButton
                key={type}
                className={clsx(
                  'flex items-center gap-2 text-left text-sm',
                  type === blockType && 'bg-[--primary-minor-2] font-bold',
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
        <input
          ref={imageInputRef}
          className="absolute left-0 top-0 h-px w-px opacity-0"
          type="file"
          accept="image/*"
          onChange={async (event: React.ChangeEvent<HTMLInputElement>) => {
            if (!event.target.files || event.target.files.length !== 1) {
              return
            }

            if (!isEditable) {
              return
            }

            try {
              const file = event.target.files[0]
              activeEditor.dispatchCommand(INSERT_IMAGE_COMMAND, file)
            } catch (error: unknown) {
              sendErrorMessage(error)
            }
          }}
        />
        <ToolbarButton
          label={c('Action').t`Insert image`}
          disabled={!isEditable}
          onClick={() => {
            imageInputRef.current?.click()
          }}
        >
          <Icon name="image" className="h-4 w-4 fill-current" />
        </ToolbarButton>
        <TableOption editor={activeEditor} disabled={!isEditable} />
        <ToolbarSeparator />
        <ToolbarButton label={c('Action').t`Clear formatting`} disabled={!isEditable} onClick={clearFormatting}>
          <Icon name="eraser" className="h-4 w-4 fill-current" />
        </ToolbarButton>
      </div>
      <SimpleDropdown
        as={Button}
        shape="solid"
        type="button"
        className="ml-auto gap-2 bg-[--primary-minor-1] text-[--text-norm]"
        content={<>{isEditable ? <Icon name="pencil" /> : <Icon name="eye" />}</>}
      >
        <DropdownMenu>
          <DropdownMenuButton
            className="flex items-center gap-2 text-left text-sm"
            onClick={() => {
              eventBus.publish({
                type: EditorEditableChangeEvent,
                payload: {
                  editable: true,
                },
              })
            }}
          >
            <Icon name="pencil" size={4.5} />
            {c('Info').t`Editing`}
          </DropdownMenuButton>
          <DropdownMenuButton
            className="flex items-center gap-2 text-left text-sm"
            onClick={() => {
              eventBus.publish({
                type: EditorEditableChangeEvent,
                payload: {
                  editable: false,
                },
              })
            }}
          >
            <Icon name="eye" size={4.5} />
            {c('Info').t`Viewing`}
          </DropdownMenuButton>
        </DropdownMenu>
      </SimpleDropdown>
    </div>
  )
}
