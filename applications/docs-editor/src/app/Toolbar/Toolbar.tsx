import { Fragment, useCallback, useEffect, useMemo, useRef, useState } from 'react'

import { $isCodeNode } from '@lexical/code'
import type { ListType } from '@lexical/list'
import {
  $isListNode,
  INSERT_CHECK_LIST_COMMAND,
  INSERT_ORDERED_LIST_COMMAND,
  INSERT_UNORDERED_LIST_COMMAND,
  ListNode,
} from '@lexical/list'
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext'
import type { HeadingTagType } from '@lexical/rich-text'
import { $isHeadingNode, $isQuoteNode } from '@lexical/rich-text'
import { $getSelectionStyleValueForProperty } from '@lexical/selection'
import { $findMatchingParent, $getNearestNodeOfType, mergeRegister } from '@lexical/utils'
import type { ElementFormatType } from 'lexical'
import {
  $getSelection,
  $isElementNode,
  $isRangeSelection,
  $isRootOrShadowRoot,
  CAN_REDO_COMMAND,
  CAN_UNDO_COMMAND,
  COMMAND_PRIORITY_CRITICAL,
  COMMAND_PRIORITY_NORMAL,
  FORMAT_ELEMENT_COMMAND,
  FORMAT_TEXT_COMMAND,
  INDENT_CONTENT_COMMAND,
  OUTDENT_CONTENT_COMMAND,
  REDO_COMMAND,
  SELECTION_CHANGE_COMMAND,
  UNDO_COMMAND,
} from 'lexical'

import { $isLinkNode } from '@lexical/link'
import { useLexicalEditable } from '@lexical/react/useLexicalEditable'
import { Button } from '@proton/atoms'
import {
  Dropdown,
  DropdownButton,
  DropdownMenu,
  DropdownMenuButton,
  Icon,
  SimpleDropdown,
  Spotlight,
  usePopperAnchor,
} from '@proton/components'
import { getFontFaceIdFromValue, getFontFaceValueFromId } from '@proton/components/components/editor/helpers/fontFace'
import { rootFontSize } from '@proton/shared/lib/helpers/dom'
import clsx from '@proton/utils/clsx'
import { c } from 'ttag'
import { FontColorMenu } from '../Components/ColorMenu'
import AlphabeticalListIcon from '../Icons/AlphabeticalListIcon'
import CheckListIcon from '../Icons/CheckListIcon'
import IndentIcon from '../Icons/IndentIcon'
import OutdentIcon from '../Icons/OutdentIcon'
import RedoIcon from '../Icons/RedoIcon'
import TableIcon from '../Icons/TableIcon'
import UndoIcon from '../Icons/UndoIcon'
import { EDIT_LINK_COMMAND } from '../Plugins/Link/LinkInfoPlugin'
import { INSERT_TABLE_COMMAND } from '../Plugins/Table/Commands'
import { DefaultFont, FontOptions, FontSizes } from '../Shared/Fonts'
import { reportErrorToSentry } from '../Utils/errorMessage'
import { getHTMLElementFontSize } from '../Utils/getHTMLElementFontSize'
import { getSelectedNode } from '../Utils/getSelectedNode'
import AlignmentMenuOptions, { AlignmentOptions } from './AlignmentMenuOptions'
import { ToolbarButton } from './ToolbarButton'
import { ToolbarSeparator } from './ToolbarSeparator'

import { INSERT_HORIZONTAL_RULE_COMMAND } from '@lexical/react/LexicalHorizontalRuleNode'
import { INSERT_INLINE_COMMENT_COMMAND } from '../Commands'
import AddCommentIcon from '../Icons/AddCommentIcon'
import DividerIcon from '../Icons/DividerIcon'
import RomanListIcon from '../Icons/RomanListIcon'
import { $isCustomListNode } from '../Plugins/CustomList/$isCustomListNode'
import { INSERT_CUSTOM_ORDERED_LIST_COMMAND } from '../Plugins/CustomList/CustomListCommands'
import type { CustomListMarker, CustomListStyleType } from '../Plugins/CustomList/CustomListTypes'
import { KEYBOARD_SHORTCUT_COMMAND } from '../Plugins/KeyboardShortcuts/Command'
import { ModifierKbd, ShortcutKbd } from '../Plugins/KeyboardShortcuts/ShortcutKbd'
import { ShortcutLabel } from '../Plugins/KeyboardShortcuts/ShortcutLabel'
import { ShortcutLabelContainer } from '../Plugins/KeyboardShortcuts/ShortcutLabelContainer'
import { ShortcutLabelText } from '../Plugins/KeyboardShortcuts/ShortcutLabelText'
import './Toolbar.scss'
import ToolbarTooltip from './ToolbarTooltip'
import { CLEAR_FORMATTING_COMMAND, SET_SELECTION_STYLE_PROPERTY_COMMAND } from '../Plugins/FormattingPlugin'
import { INSERT_FILE_COMMAND } from '../Commands/Events'
import { EditorUserMode } from '../Lib/EditorUserMode'
import type { BlockType } from '../Plugins/BlockTypePlugin'
import { blockTypeToBlockName, SET_BLOCK_TYPE_COMMAND } from '../Plugins/BlockTypePlugin'
import { EditorEvent, TooltipKey, useTooltipOnce } from '@proton/docs-shared'
import type { EditorRequiresClientMethods } from '@proton/docs-shared'
import { EditorSystemMode } from '@proton/docs-shared'
import SpeechBubblePenIcon from '../Icons/SpeechBubblePenIcon'
import { SpotlightIllustration } from '../Icons/SpotlightIllustration'
import { InteractionDropdownButton } from './InteractionDropdownButton'
import { isHTMLElement } from '../Utils/guard'
import { stepFontSize } from './stepFontSize'
import { isMobile } from './isMobile'
import type { ToolbarItems } from './ToolbarItems'
import { OverflowMenuItem } from './OverflowMenuItem'
import { ToolbarItem } from './ToolbarItem'
import { useEditorStateValues } from '../Lib/useEditorStateValues'
import { TableOfContents } from './TableOfContents'
import { useApplication } from '../Containers/ApplicationProvider'
import { isDevOrBlack } from '@proton/docs-shared'

export default function DocumentEditorToolbar({
  userMode,
  systemMode,
  onUserModeChange,
  hasEditAccess,
  isPreviewModeToolbar = false,
  clientInvoker,
  isEditorHidden,
}: {
  userMode: EditorUserMode
  systemMode: EditorSystemMode
  onUserModeChange: (mode: EditorUserMode) => void
  hasEditAccess: boolean
  isPreviewModeToolbar?: boolean
  clientInvoker?: EditorRequiresClientMethods
  isEditorHidden?: boolean
}) {
  const { application } = useApplication()
  const [editor] = useLexicalComposerContext()
  const [activeEditor, setActiveEditor] = useState(editor)

  const { suggestionsEnabled } = useEditorStateValues()

  const canShowSuggestionsButton = suggestionsEnabled

  const isEditable = useLexicalEditable()

  const [canUndo, setCanUndo] = useState(false)
  const [canRedo, setCanRedo] = useState(false)

  const [blockType, setBlockType] = useState<BlockType>('paragraph')
  const [isCodeBlock, setIsCodeBlock] = useState(false)
  const [isQuote, setIsQuote] = useState(false)

  const [listType, setListType] = useState<ListType>()
  const [listStyleType, setListStyleType] = useState<CustomListStyleType>()
  const [listMarker, setListMarker] = useState<CustomListMarker>()
  const [elementFormat, setElementFormat] = useState<ElementFormatType>('left')

  const [isBold, setIsBold] = useState(false)
  const [isItalic, setIsItalic] = useState(false)
  const [isUnderline, setIsUnderline] = useState(false)
  const [isStrikethrough, setIsStrikethrough] = useState(false)
  const [isLink, setIsLink] = useState(false)
  const defaultFontSize = `${rootFontSize()}px`
  const [fontSize, setFontSize] = useState(defaultFontSize)
  const [textColor, setTextColor] = useState('')
  const [backgroundColor, setBackgroundColor] = useState('')

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

  const formatParagraph = useCallback(() => {
    editor.dispatchCommand(SET_BLOCK_TYPE_COMMAND, 'paragraph')
    focusEditor()
  }, [editor, focusEditor])

  const formatHeading = useCallback(
    (headingSize: HeadingTagType) => {
      if (blockType !== headingSize) {
        editor.dispatchCommand(SET_BLOCK_TYPE_COMMAND, headingSize)
        focusEditor()
      }
    },
    [editor, blockType, focusEditor],
  )

  const formatQuote = useCallback(() => {
    if (!isQuote) {
      editor.dispatchCommand(SET_BLOCK_TYPE_COMMAND, 'quote')
      focusEditor()
    } else {
      formatParagraph()
    }
  }, [editor, focusEditor, formatParagraph, isQuote])

  const formatCode = useCallback(() => {
    if (!isCodeBlock) {
      editor.dispatchCommand(SET_BLOCK_TYPE_COMMAND, 'code')
      focusEditor()
    } else {
      formatParagraph()
    }
  }, [editor, focusEditor, isCodeBlock, formatParagraph])

  const formatBulletList = useCallback(() => {
    if (listType !== 'bullet') {
      editor.dispatchCommand(INSERT_UNORDERED_LIST_COMMAND, undefined)
      focusEditor()
    } else {
      formatParagraph()
    }
  }, [editor, focusEditor, formatParagraph, listType])

  const formatCustomList = useCallback(
    (type: CustomListStyleType, marker?: CustomListMarker) => {
      editor.dispatchCommand(INSERT_CUSTOM_ORDERED_LIST_COMMAND, { type, marker })
    },
    [editor],
  )

  const formatCheckList = useCallback(() => {
    if (listType !== 'check') {
      editor.dispatchCommand(INSERT_CHECK_LIST_COMMAND, undefined)
      focusEditor()
    } else {
      formatParagraph()
    }
  }, [editor, focusEditor, formatParagraph, listType])

  const formatNumberedList = useCallback(() => {
    if (listType !== 'number' || listStyleType) {
      editor.dispatchCommand(INSERT_ORDERED_LIST_COMMAND, undefined)
      focusEditor()
    } else {
      formatParagraph()
    }
  }, [editor, focusEditor, formatParagraph, listStyleType, listType])

  const editLink = () => {
    activeEditor.dispatchCommand(EDIT_LINK_COMMAND, undefined)
  }

  const insertImage = () => {
    imageInputRef.current?.click()
  }

  const insertTable = useCallback(() => {
    activeEditor.dispatchCommand(INSERT_TABLE_COMMAND, {
      rows: '3',
      columns: '3',
      includeHeaders: {
        rows: true,
        columns: false,
      },
      fullWidth: true,
    })
  }, [activeEditor])

  const insertHorizontalRule = () => {
    activeEditor.dispatchCommand(INSERT_HORIZONTAL_RULE_COMMAND, undefined)
  }

  const insertComment = () => {
    activeEditor.dispatchCommand(INSERT_INLINE_COMMENT_COMMAND, undefined)
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
          const elementOrParent = parentList || element
          const type = elementOrParent.getListType()
          setListType(type)

          if ($isCustomListNode(elementOrParent)) {
            const listStyleType = elementOrParent.getListStyleType()
            const listMarker = elementOrParent.getListMarker()
            setListStyleType(listStyleType)
            setListMarker(listMarker)
          }
        } else {
          setListType(undefined)
          setListStyleType(undefined)
          setListMarker(undefined)
        }
      }

      const defaultFontSizeValue = elementDOM ? `${getHTMLElementFontSize(elementDOM)}px` : defaultFontSize
      setFontSize($getSelectionStyleValueForProperty(selection, 'font-size', defaultFontSizeValue))

      setTextColor($getSelectionStyleValueForProperty(selection, 'color'))
      setBackgroundColor($getSelectionStyleValueForProperty(selection, 'background-color'))

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
  }, [$updateToolbar, clientInvoker, editor])

  const setFontSizeForSelection = useCallback(
    (newFontSize: string) => {
      activeEditor.dispatchCommand(SET_SELECTION_STYLE_PROPERTY_COMMAND, { property: 'font-size', value: newFontSize })
    },
    [activeEditor],
  )

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
        KEYBOARD_SHORTCUT_COMMAND,
        ({ shortcut }) => {
          switch (shortcut) {
            case 'EDIT_LINK_SHORTCUT': {
              return activeEditor.dispatchCommand(EDIT_LINK_COMMAND, undefined)
            }
            case 'STRIKETHROUGH_TOGGLE_SHORTCUT': {
              return activeEditor.dispatchCommand(FORMAT_TEXT_COMMAND, 'strikethrough')
            }
            case 'SAVE_SHORTCUT': {
              return true
            }
            case 'INCREASE_FONT_SIZE_SHORTCUT':
            case 'DECREASE_FONT_SIZE_SHORTCUT': {
              const fontStep = shortcut === 'INCREASE_FONT_SIZE_SHORTCUT' ? 1 : -1
              const selection = $getSelection()
              if (!$isRangeSelection(selection)) {
                return false
              }
              const currentFontSize = $getSelectionStyleValueForProperty(selection, 'font-size', fontSize)
              const nextFontSize = stepFontSize(currentFontSize, fontStep)
              setFontSizeForSelection(nextFontSize)
              return true
            }
            case 'QUOTE_TOGGLE_SHORTCUT': {
              formatQuote()
              return true
            }
            case 'CODE_BLOCK_TOGGLE_SHORTCUT': {
              formatCode()
              return true
            }
            case 'INCREASE_INDENTATION_SHORTCUT': {
              return activeEditor.dispatchCommand(INDENT_CONTENT_COMMAND, undefined)
            }
            case 'DECREASE_INDENTATION_SHORTCUT': {
              return activeEditor.dispatchCommand(OUTDENT_CONTENT_COMMAND, undefined)
            }
            case 'NORMAL_TEXT_SHORTCUT': {
              formatParagraph()
              return true
            }
            case 'HEADING_1_SHORTCUT': {
              formatHeading('h1')
              return true
            }
            case 'HEADING_2_SHORTCUT': {
              formatHeading('h2')
              return true
            }
            case 'HEADING_3_SHORTCUT': {
              formatHeading('h3')
              return true
            }
            case 'HEADING_4_SHORTCUT': {
              formatHeading('h4')
              return true
            }
            case 'HEADING_5_SHORTCUT': {
              formatHeading('h5')
              return true
            }
            case 'HEADING_6_SHORTCUT': {
              formatHeading('h6')
              return true
            }
            case 'LEFT_ALIGN_SHORTCUT': {
              return activeEditor.dispatchCommand(FORMAT_ELEMENT_COMMAND, 'left')
            }
            case 'CENTER_ALIGN_SHORTCUT': {
              // eslint-disable-next-line custom-rules/deprecate-classes
              return activeEditor.dispatchCommand(FORMAT_ELEMENT_COMMAND, 'center')
            }
            case 'RIGHT_ALIGN_SHORTCUT': {
              return activeEditor.dispatchCommand(FORMAT_ELEMENT_COMMAND, 'right')
            }
            case 'JUSTIFY_SHORTCUT': {
              return activeEditor.dispatchCommand(FORMAT_ELEMENT_COMMAND, 'justify')
            }
            case 'NUMBERED_LIST_SHORTCUT': {
              formatNumberedList()
              return true
            }
            case 'BULLET_LIST_SHORTCUT': {
              formatBulletList()
              return true
            }
            case 'CHECK_LIST_SHORTCUT': {
              formatCheckList()
              return true
            }
            case 'INSERT_TABLE_SHORTCUT': {
              insertTable()
              return true
            }
            default: {
              return false
            }
          }
        },
        COMMAND_PRIORITY_NORMAL,
      ),
    )
  }, [
    $updateToolbar,
    activeEditor,
    formatCode,
    formatQuote,
    fontSize,
    formatBulletList,
    formatCheckList,
    formatHeading,
    formatNumberedList,
    formatParagraph,
    setFontSizeForSelection,
    insertTable,
  ])

  const clearFormatting = useCallback(() => {
    activeEditor.dispatchCommand(CLEAR_FORMATTING_COMMAND, undefined)
  }, [activeEditor])

  const blockTypes: {
    type: BlockType
    name: string
    tooltip: React.ReactNode
    onClick: () => void
    className?: string
  }[] = [
    {
      type: 'paragraph',
      name: blockTypeToBlockName.paragraph,
      onClick: formatParagraph,
      tooltip: <ShortcutLabel shortcut="NORMAL_TEXT_SHORTCUT" />,
      className: 'Lexical__paragraph',
    },
    {
      type: 'h1',
      name: blockTypeToBlockName.h1,
      onClick: () => formatHeading('h1'),
      tooltip: <ShortcutLabel shortcut="HEADING_1_SHORTCUT" />,
      className: 'Lexical__h1 mb-0 mt-0',
    },
    {
      type: 'h2',
      name: blockTypeToBlockName.h2,
      onClick: () => formatHeading('h2'),
      tooltip: <ShortcutLabel shortcut="HEADING_2_SHORTCUT" />,
      className: 'Lexical__h2 mb-0 mt-0',
    },
    {
      type: 'h3',
      name: blockTypeToBlockName.h3,
      onClick: () => formatHeading('h3'),
      tooltip: <ShortcutLabel shortcut="HEADING_3_SHORTCUT" />,
      className: 'Lexical__h3 mb-0 mt-0',
    },
    {
      type: 'h4',
      name: blockTypeToBlockName.h4,
      onClick: () => formatHeading('h4'),
      tooltip: <ShortcutLabel shortcut="HEADING_4_SHORTCUT" />,
      className: 'Lexical__h4 color-weak mb-0 mt-0',
    },
    {
      type: 'h5',
      name: blockTypeToBlockName.h5,
      onClick: () => formatHeading('h5'),
      tooltip: <ShortcutLabel shortcut="HEADING_5_SHORTCUT" />,
      className: 'Lexical__h5 color-weak mb-0 mt-0',
    },
    {
      type: 'h6',
      name: blockTypeToBlockName.h6,
      onClick: () => formatHeading('h6'),
      tooltip: <ShortcutLabel shortcut="HEADING_6_SHORTCUT" />,
      className: 'Lexical__h6 color-weak mb-0 mt-0',
    },
  ]

  const listTypes = [
    {
      type: 'check',
      icon: <CheckListIcon className="h-4 w-4 fill-current" />,
      tooltip: <ShortcutLabel shortcut="CHECK_LIST_SHORTCUT" />,
      name: c('Action').t`Check List`,
      onClick: formatCheckList,
    },
    {
      type: 'bullet',
      icon: <Icon name="list-bullets" />,
      tooltip: <ShortcutLabel shortcut="BULLET_LIST_SHORTCUT" />,
      name: c('Action').t`Bulleted List`,
      onClick: formatBulletList,
    },
    {
      type: 'number',
      icon: <Icon name="list-numbers" />,
      tooltip: <ShortcutLabel shortcut="NUMBERED_LIST_SHORTCUT" />,
      name: c('Action').t`Numbered List`,
      onClick: formatNumberedList,
    },
  ]

  const setFontFamilyForSelection = useCallback(
    (id: string) => {
      const value = getFontFaceValueFromId(id)
      if (!value) {
        return
      }
      activeEditor.dispatchCommand(SET_SELECTION_STYLE_PROPERTY_COMMAND, {
        property: 'font-family',
        value,
      })
    },
    [activeEditor],
  )

  const updateTextStyle = useCallback(
    (property: string, value: string | null) => {
      activeEditor.dispatchCommand(SET_SELECTION_STYLE_PROPERTY_COMMAND, {
        property,
        value,
      })
    },
    [activeEditor],
  )

  const DropdownContentProps = useMemo(
    () => ({
      onClosed: () => {
        const activeElement = document.activeElement
        const rootElementParent = editor.getRootElement()?.parentElement
        if (!rootElementParent || rootElementParent.contains(activeElement)) {
          return
        }
        focusEditor()
      },
    }),
    [editor, focusEditor],
  )

  const onToolbarAnywhereClicked = useCallback(() => {
    void clientInvoker?.editorReportingEvent(EditorEvent.ToolbarClicked, undefined)
  }, [clientInvoker])

  const isEditMode = userMode === EditorUserMode.Edit
  const isPreviewMode = userMode === EditorUserMode.Preview
  const isSuggestionMode = userMode === EditorUserMode.Suggest

  const { shouldShowTooltip: suggestionTooltipNotShownPreviously } = useTooltipOnce(
    TooltipKey.DocsSuggestionModeSpotlight,
    new Date('2024-11-22'),
  )

  const shouldShowSuggestionTooltip =
    systemMode !== EditorSystemMode.PublicView && suggestionTooltipNotShownPreviously && !isMobile()

  const buttonsContainerRef = useRef<HTMLDivElement | null>(null)
  const [visibleButtons, setVisibleButtons] = useState<Record<string, boolean>>({})
  useEffect(() => {
    const buttonsContainer = buttonsContainerRef.current
    if (!buttonsContainer) {
      return
    }

    const handler = (entries: IntersectionObserverEntry[]) => {
      const updatedMap: Record<string, boolean> = {}
      for (const entry of entries) {
        if (!(entry.target instanceof HTMLElement)) {
          continue
        }
        const testid = entry.target.dataset.testid
        if (!testid) {
          continue
        }
        if (entry.isIntersecting && entry.intersectionRatio === 1) {
          updatedMap[testid] = true
        } else {
          updatedMap[testid] = false
        }
      }
      setVisibleButtons((prev) => ({
        ...prev,
        ...updatedMap,
      }))
    }

    const observer = new IntersectionObserver(handler, {
      root: buttonsContainer,
      threshold: 1,
    })

    for (const child of buttonsContainer.children) {
      observer.observe(child)
    }

    return () => {
      observer.disconnect()
    }
  }, [])

  const {
    anchorRef: overflowMenuAnchorRef,
    isOpen: isOverflowMenuOpen,
    toggle: toggleOverflowMenu,
    close: closeOverflowMenu,
  } = usePopperAnchor<HTMLButtonElement>()

  const toolbarItems: ToolbarItems = [
    {
      id: 'undo-redo-options',
      items: [
        {
          id: 'undo-button',
          type: 'button',
          label: c('Action').t`Undo`,
          shortcut: 'UNDO_SHORTCUT',
          onClick: undo,
          disabled: !isEditable || !canUndo,
          icon: <UndoIcon className="h-4 w-4 fill-current" />,
        },
        {
          id: 'redo-button',
          type: 'button',
          label: c('Action').t`Redo`,
          shortcut: 'REDO_SHORTCUT',
          onClick: redo,
          disabled: !isEditable || !canRedo,
          icon: <RedoIcon className="h-4 w-4 fill-current" />,
        },
      ],
    },
    {
      id: 'font-style-options',
      items: [
        {
          id: 'headings-options',
          type: 'dropdown',
          label: () => (
            <span
              className="w-custom line-clamp-1 break-all"
              style={{
                '--w-custom': '9ch',
              }}
            >
              {blockTypeToBlockName[blockType]}
            </span>
          ),
          menu: (
            <DropdownMenu>
              {blockTypes.map(({ type, name, onClick, tooltip, className }) => (
                <ToolbarTooltip key={type} title={tooltip} originalPlacement="right">
                  <DropdownMenuButton className={`text-left ${className}`} onClick={onClick} disabled={!isEditable}>
                    {name}
                  </DropdownMenuButton>
                </ToolbarTooltip>
              ))}
            </DropdownMenu>
          ),
          disabled: !isEditable,
          dropdownProps: DropdownContentProps,
          overflowBehavior: 'submenu',
        },
        {
          id: 'font-family',
          type: 'dropdown',
          label: () => (
            <span
              className="w-custom line-clamp-1 break-all"
              style={{
                '--w-custom': '7ch',
              }}
            >
              {fontFamilyLabel}
            </span>
          ),
          menu: (
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
          ),
          disabled: !isEditable,
          dropdownProps: DropdownContentProps,
          overflowBehavior: 'submenu',
        },
      ],
    },
    {
      id: 'font-size-option',
      items: [
        {
          id: 'font-size',
          type: 'dropdown',
          label: () => fontSize,
          menu: (
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
          ),
          disabled: !isEditable,
          tooltip: (
            <ShortcutLabelContainer>
              <ShortcutLabelText>{c('Action').t`Adjust font size`}</ShortcutLabelText>
              <ModifierKbd /> <ShortcutKbd shortcut="Shift" />
              <ShortcutKbd shortcut="." /> <ShortcutLabelText>{c('Action').t`and`}</ShortcutLabelText>
              <ShortcutKbd shortcut="," />
            </ShortcutLabelContainer>
          ),
          dropdownProps: DropdownContentProps,
          overflowBehavior: 'submenu',
        },
      ],
    },
    {
      id: 'indent-options',
      items: [
        {
          id: 'indent-dropdown',
          type: 'button',
          label: c('Action').t`Indent`,
          icon: <IndentIcon className="h-4 w-4 fill-current" />,
          disabled: !isEditable,
          onClick: () => {
            activeEditor.dispatchCommand(INDENT_CONTENT_COMMAND, undefined)
          },
          shortcut: 'INCREASE_INDENTATION_SHORTCUT',
        },
        {
          id: 'outdent-dropdown',
          type: 'button',
          label: c('Action').t`Outdent`,
          icon: <OutdentIcon className="h-4 w-4 fill-current" />,
          disabled: !isEditable,
          onClick: () => {
            activeEditor.dispatchCommand(OUTDENT_CONTENT_COMMAND, undefined)
          },
          shortcut: 'DECREASE_INDENTATION_SHORTCUT',
        },
      ],
      showInToolbar: false,
    },
    {
      id: 'formatting-options',
      className: (visible) =>
        clsx('order-[-1] md:order-[unset]', !visible && '[visibility:visible] md:[visibility:hidden]'),
      items: [
        {
          id: 'bold-button',
          type: 'button',
          label: c('Action').t`Bold`,
          shortcut: 'BOLD_SHORTCUT',
          onClick: formatBold,
          disabled: !isEditable,
          active: isBold,
          icon: <Icon name="text-bold" />,
        },
        {
          id: 'italic-button',
          type: 'button',
          label: c('Action').t`Italic`,
          shortcut: 'ITALIC_SHORTCUT',
          onClick: formatItalic,
          disabled: !isEditable,
          active: isItalic,
          icon: <Icon name="text-italic" />,
        },
        {
          id: 'underline-button',
          type: 'button',
          label: c('Action').t`Underline`,
          shortcut: 'UNDERLINE_SHORTCUT',
          onClick: formatUnderline,
          disabled: !isEditable,
          active: isUnderline,
          icon: <Icon name="text-underline" />,
        },
        {
          id: 'strikethrough-button',
          type: 'button',
          label: c('Action').t`Strike-through`,
          shortcut: 'STRIKETHROUGH_TOGGLE_SHORTCUT',
          onClick: formatStrikethrough,
          disabled: !isEditable,
          active: isStrikethrough,
          icon: <Icon name="text-strikethrough" />,
        },
        {
          id: 'font-color-dropdown',
          type: 'dropdown',
          dropdownProps: {
            ...DropdownContentProps,
            contentProps: {
              style: {
                '--max-width': 'none',
              },
            },
          },
          hasCaret: false,
          label: (target) => (
            <div className="h-4 w-4">
              <div
                className="border-weak bg-norm absolute left-1/2 top-1/2 h-6 w-6 -translate-x-1/2 -translate-y-1/2 rounded-[4px] border text-[1rem]"
                aria-hidden="true"
                style={{
                  backgroundColor,
                  color: textColor,
                }}
              >
                <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">A</span>
              </div>
              <span className={target === 'toolbar' ? 'sr-only' : 'mr-auto'}>{c('Action').t`Colour`}</span>
            </div>
          ),
          menu: (
            <FontColorMenu
              currentTextColor={textColor}
              onTextColorChange={(color) => updateTextStyle('color', color)}
              currentBackgroundColor={backgroundColor}
              onBackgroundColorChange={(color) => updateTextStyle('background-color', color)}
            />
          ),
          disabled: !isEditable,
          useToolbarButton: true,
          overflowBehavior: 'submenu',
        },
      ],
    },
    {
      id: 'insert-options',
      items: [
        {
          id: 'link-button',
          type: 'button',
          label: c('Action').t`Insert link`,
          shortcut: 'EDIT_LINK_SHORTCUT',
          disabled: !isEditable,
          active: isLink,
          onClick: editLink,
          icon: <Icon name="link" className="h-4 w-4 fill-current" />,
        },
        {
          id: 'image-insert-button',
          type: 'button',
          label: c('Action').t`Insert image`,
          disabled: !isEditable,
          onClick: insertImage,
          icon: <Icon name="image" className="h-4 w-4 fill-current" />,
        },
        {
          id: 'table-button',
          type: 'button',
          label: c('Action').t`Insert table`,
          shortcut: 'INSERT_TABLE_SHORTCUT',
          disabled: !isEditable,
          onClick: insertTable,
          icon: <TableIcon className="h-4 w-4 fill-current" />,
        },
        {
          id: 'comment-button',
          type: 'button',
          label: c('Action').t`Insert comment`,
          shortcut: 'INSERT_COMMENT_SHORTCUT',
          disabled: !isEditable,
          onClick: insertComment,
          icon: <AddCommentIcon className="h-4 w-4 fill-current" />,
        },
      ],
    },
    {
      id: 'divider-option',
      items: [
        {
          id: 'divider-dropdown',
          type: 'button',
          label: c('Action').t`Divider`,
          disabled: !isEditable,
          onClick: insertHorizontalRule,
          icon: <DividerIcon className="h-4 w-4 fill-current" />,
        },
      ],
      showInToolbar: false,
    },
    {
      id: 'alignment-options',
      items: [
        {
          id: 'alignment-button',
          type: 'dropdown',
          active: elementFormat !== 'left',
          label: () =>
            AlignmentOptions.find(({ align }) => align === elementFormat)?.icon || <Icon name="text-align-left" />,
          disabled: !isEditable,
          dropdownProps: DropdownContentProps,
          menu: (
            <DropdownMenu>
              <AlignmentMenuOptions activeEditor={activeEditor} elementFormat={elementFormat} isEditable={isEditable} />
            </DropdownMenu>
          ),
          useToolbarButton: true,
          overflowBehavior: 'spread-items',
        },
      ],
    },
    {
      id: 'list-options',
      items: [
        {
          id: 'list-types-dropdown',
          type: 'dropdown',
          active: listTypes.some(({ type }) => type === listType),
          label: () =>
            listTypes.find(({ type }) => type === listType)?.icon || <CheckListIcon className="h-4 w-4 fill-current" />,
          disabled: !isEditable,
          dropdownProps: DropdownContentProps,
          menu: (
            <DropdownMenu>
              {listTypes.map(({ type, icon, name, onClick, tooltip }) => (
                <ToolbarTooltip key={type} title={tooltip} originalPlacement="right">
                  <DropdownMenuButton
                    className={clsx(
                      'flex items-center gap-2 text-left text-sm',
                      !listStyleType && type === listType && 'active font-bold',
                    )}
                    onClick={onClick}
                    disabled={!isEditable}
                  >
                    {icon}
                    {name}
                  </DropdownMenuButton>
                </ToolbarTooltip>
              ))}

              <SimpleDropdown
                as={DropdownMenuButton}
                className={clsx(
                  'flex items-center gap-2 text-left text-sm',
                  listStyleType && listStyleType !== 'upper-roman' && 'active font-bold',
                )}
                data-testid="dropdown-alphabetical-list"
                content={
                  <>
                    <AlphabeticalListIcon className="color-weak h-4 w-4" />
                    {c('Action').t`Alphabetical`}
                    <Icon name="chevron-right-filled" className="ml-auto" />
                  </>
                }
                hasCaret={false}
                onClick={(event: MouseEvent) => {
                  event.preventDefault()
                  event.stopPropagation()
                }}
                originalPlacement="right-start"
                contentProps={{
                  offset: 0,
                }}
              >
                <DropdownMenu className="text-sm">
                  <DropdownMenuButton
                    className={clsx(
                      'flex items-center text-left',
                      listStyleType === 'upper-alpha' && listMarker === 'period' && 'active font-bold',
                    )}
                    onClick={() => {
                      formatCustomList('upper-alpha')
                    }}
                  >
                    {c('Action').t`A. B. C. D.`}
                  </DropdownMenuButton>
                  <DropdownMenuButton
                    className={clsx(
                      'flex items-center text-left',
                      listStyleType === 'lower-alpha' && listMarker === 'period' && 'active font-bold',
                    )}
                    onClick={() => {
                      formatCustomList('lower-alpha')
                    }}
                  >
                    {c('Action').t`a. b. c. d.`}
                  </DropdownMenuButton>
                  <DropdownMenuButton
                    className={clsx(
                      'flex items-center text-left',
                      listStyleType === 'upper-alpha' && listMarker === 'bracket' && 'active font-bold',
                    )}
                    onClick={() => {
                      formatCustomList('upper-alpha', 'bracket')
                    }}
                  >
                    {c('Action').t`A) B) C) D)`}
                  </DropdownMenuButton>
                  <DropdownMenuButton
                    className={clsx(
                      'flex items-center text-left',
                      listStyleType === 'lower-alpha' && listMarker === 'bracket' && 'active font-bold',
                    )}
                    onClick={() => {
                      formatCustomList('lower-alpha', 'bracket')
                    }}
                  >
                    {c('Action').t`a) b) c) d)`}
                  </DropdownMenuButton>
                </DropdownMenu>
              </SimpleDropdown>

              <DropdownMenuButton
                className={clsx(
                  'flex items-center gap-2 text-left text-sm',
                  listStyleType === 'upper-roman' && 'active font-bold',
                )}
                onClick={() => formatCustomList('upper-roman')}
                disabled={!isEditable}
              >
                <RomanListIcon className="color-weak h-4 w-4" />
                {c('Action').t`Roman`}
              </DropdownMenuButton>
            </DropdownMenu>
          ),
          useToolbarButton: true,
          overflowBehavior: 'spread-items',
        },
      ],
    },
    {
      id: 'code-quote-options',
      items: [
        {
          id: 'code-block-button',
          type: 'button',
          label: c('Action').t`Code block`,
          shortcut: 'CODE_BLOCK_TOGGLE_SHORTCUT',
          disabled: !isEditable || isSuggestionMode,
          onClick: formatCode,
          icon: <Icon name="code" />,
          active: isCodeBlock,
        },
        {
          id: 'quote-button',
          type: 'button',
          label: c('Action').t`Quote`,
          shortcut: 'QUOTE_TOGGLE_SHORTCUT',
          disabled: !isEditable,
          onClick: formatQuote,
          icon: <Icon name="text-quote" />,
          active: isQuote,
        },
      ],
    },
    {
      id: 'clear-formatting-option',
      items: [
        {
          id: 'clear-formatting-button',
          type: 'button',
          label: c('Action').t`Clear formatting`,
          disabled: !isEditable,
          onClick: clearFormatting,
          icon: <Icon name="eraser" />,
        },
      ],
      showInToolbar: false,
    },
  ]

  const isTableOfContentsEnabled = application.environment === 'alpha' || isDevOrBlack()

  if (isTableOfContentsEnabled) {
    toolbarItems.unshift({
      id: 'toc-option',
      items: [
        {
          id: 'toc-button',
          type: 'dropdown',
          label: (target) => (
            <>
              <Icon name="text-title" />
              <span className={clsx(target === 'toolbar' && 'sr-only')}>{c('Action').t`Table of contents`}</span>
            </>
          ),
          disabled: false,
          dropdownProps: DropdownContentProps,
          overflowBehavior: 'submenu',
          tooltip: c('Action').t`Table of contents`,
          menu: (
            <>
              <div className="bg-weak color-danger flex items-center gap-2 px-3 py-1 text-sm">
                <Icon name="info-circle" className="align-middle" />
                <span className="align-middle">{c('Info').t`Alpha only experimental feature`}</span>
              </div>
              <TableOfContents />
            </>
          ),
        },
      ],
    })
  }

  return (
    // eslint-disable-next-line jsx-a11y/prefer-tag-over-role
    <div
      className="bg-norm z-1 flex flex-nowrap items-center gap-1.5 print:hidden"
      style={{
        gridColumn: '1 / 3',
        gridRow: '1',
        scrollbarWidth: 'thin',
      }}
      onClick={onToolbarAnywhereClicked}
      role="presentation"
    >
      <div
        className="DocumentEditorToolbar bg-norm flex w-full flex-nowrap items-center gap-1.5 px-3 py-1.5 md:mx-auto md:max-w-max md:[border-radius:1rem]"
        data-testid={isPreviewModeToolbar ? 'preview-mode-toolbar' : 'main-toolbar'}
      >
        <div
          className="flex flex-nowrap items-center gap-1.5 overflow-hidden [&>*]:flex-shrink-0"
          ref={buttonsContainerRef}
        >
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
                activeEditor.dispatchCommand(INSERT_FILE_COMMAND, file)
              } catch (error: unknown) {
                reportErrorToSentry(error)
              } finally {
                imageInputRef.current!.value = ''
              }
            }}
            data-testid="image-input"
            tabIndex={-1}
          />
          {toolbarItems.map((group) => {
            if (group.showInToolbar === false) {
              return null
            }

            const isVisible = visibleButtons[group.id]

            return (
              <div
                className={clsx(
                  'flex flex-nowrap items-center gap-1.5',
                  group.className ? group.className(isVisible) : !isVisible && 'visibility-hidden',
                )}
                key={group.id}
                data-testid={group.id}
              >
                {group.items.map((item) => (
                  <ToolbarItem key={item.id} item={item} />
                ))}
                <ToolbarSeparator />
              </div>
            )
          })}
        </div>
        <DropdownButton
          hasCaret={false}
          disabled={!isEditable}
          as={ToolbarButton}
          label={c('Action').t`More options`}
          data-testid="content-properties-button"
          className="flex-shrink-0 text-[--text-norm]"
          onClick={toggleOverflowMenu}
          ref={overflowMenuAnchorRef}
        >
          <Icon name="three-dots-vertical" />
        </DropdownButton>
        <Dropdown
          isOpen={isOverflowMenuOpen}
          anchorRef={overflowMenuAnchorRef}
          onClose={(event) => {
            const target = event?.target
            const isOpeningSubmenu = isHTMLElement(target) && target.closest('[data-submenu-button]')
            if (isOpeningSubmenu) {
              return
            }
            closeOverflowMenu()
          }}
          {...DropdownContentProps}
        >
          <DropdownMenu className="[&>li>hr]:min-h-px">
            {toolbarItems.map((group, index, array) => {
              const shouldShowInOverflowMenu = group.showInToolbar === false || !visibleButtons[group.id]
              if (!shouldShowInOverflowMenu) {
                return null
              }

              return (
                <Fragment key={group.id}>
                  {group.items.map((item) => (
                    <OverflowMenuItem key={item.id} item={item} />
                  ))}
                  {index !== array.length - 1 && <hr className="my-1" />}
                </Fragment>
              )
            })}
          </DropdownMenu>
        </Dropdown>
        {!isEditorHidden && (
          <Spotlight
            show={shouldShowSuggestionTooltip}
            content={
              <div className="flex items-center gap-4 md:flex-nowrap">
                <SpotlightIllustration className="h-12 w-12 shrink-0" />
                <div className="flex flex-col gap-1">
                  <div className="text-sm font-bold">{c('Title').t`Explore the New Suggestion Mode`}</div>
                  <div className="text-sm">{c('Description')
                    .t`Use the dropdown above to switch and start making suggestions.`}</div>
                </div>
              </div>
            }
            originalPlacement="bottom-end"
          >
            <SimpleDropdown
              as={Button}
              shape="solid"
              type="button"
              disabled={!hasEditAccess}
              className="ml-auto grid flex-shrink-0 grid-cols-2 grid-rows-1 justify-items-start gap-2 py-2 text-sm md:grid-cols-[1rem_1fr_1rem]"
              style={{
                border: '0',
                backgroundColor: isSuggestionMode ? 'var(--signal-success)' : undefined,
                color: isSuggestionMode ? 'var(--signal-success-contrast)' : undefined,
              }}
              caretClassName="!ml-0"
              content={
                <>
                  <div className={clsx('contents *:[grid-row:1]', isEditMode ? '*:opacity-100' : '*:[opacity:0]')}>
                    <Icon name="pencil" className="flex-shrink-0 [grid-column:1]" />
                    <span className="flex-shrink-0 [display:none] [grid-column:2] md:block">{c('Info')
                      .t`Editing`}</span>
                  </div>
                  <div
                    className={clsx('contents *:[grid-row:1]', isSuggestionMode ? '*:opacity-100' : '*:[opacity:0]')}
                  >
                    <SpeechBubblePenIcon className="h-4 w-4 flex-shrink-0 [grid-column:1]" />
                    <span className="flex-shrink-0 [display:none] [grid-column:2] md:block">{c('Info')
                      .t`Suggesting`}</span>
                  </div>
                  <div className={clsx('contents *:[grid-row:1]', isPreviewMode ? '*:opacity-100' : '*:[opacity:0]')}>
                    <Icon name="eye" className="flex-shrink-0 [grid-column:1]" />
                    <span className="flex-shrink-0 [display:none] [grid-column:2] md:block">{c('Info')
                      .t`Viewing`}</span>
                  </div>
                </>
              }
              contentProps={DropdownContentProps}
              data-testid="user-mode-dropdown"
              data-interaction-mode={userMode}
            >
              <DropdownMenu>
                {hasEditAccess && (
                  <>
                    <InteractionDropdownButton
                      isActive={isEditMode}
                      onClick={() => {
                        onUserModeChange(EditorUserMode.Edit)
                      }}
                      icon={<Icon name="pencil" size={4} />}
                      label={c('Info').t`Editing`}
                      description={c('Description').t`Edit document directly`}
                      data-testid={`edit-dropdown-button${isPreviewModeToolbar ? '-preview' : ''}`}
                    />
                    {canShowSuggestionsButton && (
                      <InteractionDropdownButton
                        isActive={isSuggestionMode}
                        icon={<SpeechBubblePenIcon className="h-4 w-4" />}
                        label={c('Info').t`Suggesting`}
                        description={c('Description').t`Edits become suggestions`}
                        onClick={() => {
                          onUserModeChange(EditorUserMode.Suggest)
                        }}
                        data-testid={`suggest-dropdown-button${isPreviewModeToolbar ? '-preview' : ''}`}
                        disabled={isMobile()}
                      />
                    )}
                  </>
                )}
                <InteractionDropdownButton
                  isActive={isPreviewMode}
                  label={c('Info').t`Viewing`}
                  icon={<Icon name="eye" size={4} />}
                  description={c('Description').t`Read or print final document`}
                  onClick={() => {
                    onUserModeChange(EditorUserMode.Preview)
                  }}
                  data-testid={`view-dropdown-button${isPreviewModeToolbar ? '-preview' : ''}`}
                />
              </DropdownMenu>
            </SimpleDropdown>
          </Spotlight>
        )}
      </div>
    </div>
  )
}
