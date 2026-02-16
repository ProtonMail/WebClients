import { useCallback, useEffect, useRef, useState } from 'react'

import { mergeRegister } from '@lexical/utils'
import { c } from 'ttag'

import { CircleLoader } from '@proton/atoms/CircleLoader/CircleLoader'
import {
  Dropdown,
  DropdownButton,
  DropdownMenu,
  DropdownMenuButton,
  DropdownSizeUnit,
  Icon,
  SimpleDropdown,
  Toggle,
  useAppTitle,
  useAuthentication,
  usePopperAnchor,
  useConfig,
} from '@proton/components'
import type {
  AuthenticatedDocControllerInterface,
  DocumentState,
  PublicDocumentState,
  EditorControllerInterface,
  RenameControllerInterface,
} from '@proton/docs-core'
import { isDocumentState, PostApplicationError } from '@proton/docs-core'
import type { FileMenuAction, SheetImportData } from '@proton/docs-shared'
import { type DocTrashState, FileMenuActionEvent, isWordCountSupported } from '@proton/docs-shared'
import { isPrivateNodeMeta, type DocumentAction } from '@proton/drive-store'
import { getAppHref } from '@proton/shared/lib/apps/helper'
import { APPS, APPS_CONFIGURATION, DRIVE_APP_NAME } from '@proton/shared/lib/constants'
import { getStaticURL } from '@proton/shared/lib/helpers/url'
import { useApplication } from '~/utils/application-context'
import { AutoGrowingInput } from './AutoGrowingInput'
import { useHistoryViewerModal } from '../HistoryViewerModal/HistoryViewerModal'
import { TrashedDocumentModal } from './TrashedDocumentModal'
import { useWordCount } from '../../../WordCount'
import { useExportToPDFModal } from './ExportToPDFModal'
import { useDocsContext } from '../../../context'
import { WordCountIcon } from '../icons'
import type { DocumentType } from '@proton/drive-store/store/_documents'
import { useSheetImportModal } from './SheetImportModal'
import { downloadLogsAsJSON } from '~/utils/downloadLogs'
import { useEvent, useIsDownloadLogsAllowed, useIsSheetsEnabled } from '~/utils/misc'
import { useDebugMode } from '~/utils/debug-mode-context'
import * as Ariakit from '@ariakit/react'
import clsx from '@proton/utils/clsx'
import * as UI from '@proton/docs-shared/components/ui/ui'

export type DocumentTitleDropdownProps = {
  authenticatedController: AuthenticatedDocControllerInterface | undefined
  renameController: RenameControllerInterface | undefined
  editorController: EditorControllerInterface
  documentState: DocumentState | PublicDocumentState
  actionMode?: DocumentAction['mode']
  documentType: DocumentType
}

const SupportsFieldSizing = CSS.supports('field-sizing: content')

export function DocumentTitleDropdown({
  authenticatedController,
  renameController,
  editorController,
  documentState,
  actionMode,
  documentType,
}: DocumentTitleDropdownProps) {
  const application = useApplication()
  const isPublicMode = application.isPublicMode
  const { publicContext, privateContext } = useDocsContext()
  const user = privateContext?.user || publicContext?.user
  const { getLocalID } = useAuthentication()
  const wordCount = useWordCount()
  const [title, setTitle] = useState<string | undefined>(documentState.getProperty('documentName'))
  const [isDuplicating, setIsDuplicating] = useState<boolean>(false)
  const [trashState, setTrashState] = useState<DocTrashState | undefined>(
    documentState.getProperty('documentTrashState'),
  )
  const [isMakingNewDocument, setIsMakingNewDocument] = useState<boolean>(false)
  const [isMakingNewSheetDocument, setIsMakingNewSheetDocument] = useState<boolean>(false)
  const [pdfModal, openPdfModal] = useExportToPDFModal()
  const [historyModal, showHistoryModal] = useHistoryViewerModal()
  const [sheetImportModal, showSheetImportModal] = useSheetImportModal()
  const [showVersionNumber, setShowVersionNumber] = useState(false)
  const [showDebugToggle, setShowDebugToggle] = useState(false)
  const { toggleDebugMode } = useDebugMode()
  const isDownloadLogsAllowed = useIsDownloadLogsAllowed()
  const { APP_VERSION } = useConfig()
  const isSheetsEnabled = useIsSheetsEnabled()

  const [isRenaming, setIsRenaming] = useState(false)
  const [renameInputValue, setRenameInputValue] = useState(title)
  useEffect(() => {
    setRenameInputValue(title)
  }, [title])
  const renameInputRef = useRef<HTMLInputElement>(null)

  const isSpreadsheet = documentType === 'sheet'

  useAppTitle(title, isSpreadsheet ? APPS_CONFIGURATION[APPS.PROTONSHEETS].name : undefined)

  useEffect(() => {
    // When the user holds down the shift key, show the version number. When they release, hide it.
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.shiftKey) {
        setShowVersionNumber(true)
        if (event.ctrlKey) {
          setShowDebugToggle((prev) => !prev)
        }
      }
    }

    const handleKeyUp = (event: KeyboardEvent) => {
      if (!event.shiftKey) {
        setShowVersionNumber(false)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('keyup', handleKeyUp)

    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('keyup', handleKeyUp)
    }
  }, [])

  const confirmRename = useEvent(() => {
    renameInputRef.current?.scrollTo(0, 0)

    if (!renameController) {
      throw new Error('Cannot rename document without rename controller')
    }

    const oldName = title
    const newName = renameInputValue?.trim()
    if (newName) {
      setIsRenaming(false)

      if (oldName !== newName) {
        void renameController.renameDocument(newName).then((result) => {
          if (result.isFailed()) {
            PostApplicationError(application.eventBus, { translatedError: result.getTranslatedError() })
            setTitle(oldName)
          }
        })
      }
      setTitle(newName)
    } else {
      setIsRenaming(false)
    }
  })

  const onDuplicate = useCallback(async () => {
    if (!authenticatedController) {
      throw new Error('Attempting to duplicate document in a public context')
    }

    setIsDuplicating(true)

    try {
      const editorState = await editorController?.exportData('yjs')
      if (editorState) {
        await authenticatedController.duplicateDocument(editorState)
      }
    } finally {
      setIsDuplicating(false)
    }
  }, [authenticatedController, editorController])

  const printAsPDF = useCallback(() => {
    editorController.printAsPDF().catch(console.error)
  }, [editorController])

  const onExportPDF = useCallback(
    (event: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
      event.preventDefault()
      event.stopPropagation()

      void openPdfModal({ onClose: printAsPDF })
    },
    [openPdfModal, printAsPDF],
  )

  useEffect(() => {
    return mergeRegister(
      documentState.subscribeToProperty('documentName', (title) => {
        setTitle(title)
      }),

      documentState.subscribeToProperty('documentTrashState', (trashState) => {
        setTrashState(trashState)
      }),
    )
  }, [documentState, authenticatedController])

  const onNewDocument = useCallback(
    // We default to creating the same type of document as the current one, but allow creating the other type too
    async (docType: DocumentType = documentType) => {
      const setIsLoading = docType === 'doc' ? setIsMakingNewDocument : setIsMakingNewSheetDocument
      setIsLoading(true)
      try {
        await authenticatedController?.createNewDocument(docType)
      } finally {
        setIsLoading(false)
      }
    },
    [authenticatedController, documentType],
  )

  useEffect(() => {
    if (actionMode === 'history') {
      if (!authenticatedController) {
        throw new Error('Attempting to view version history in a public context')
      }

      showHistoryModal({
        versionHistory: authenticatedController.getVersionHistory(),
        editorController,
        docController: authenticatedController,
        documentType,
        documentState,
      })
    }
  }, [authenticatedController, actionMode, showHistoryModal, editorController, documentType, documentState])

  const { anchorRef, isOpen, toggle, close } = usePopperAnchor<HTMLButtonElement>()
  const focusInputOnMount = useCallback((input: HTMLInputElement | null) => {
    if (input) {
      input.focus()
    }
  }, [])

  useEffect(() => {
    if (!isOpen) {
      setShowDebugToggle(false)
    }
  }, [isOpen])

  const openProtonDrive = useCallback(
    (to = '/', target = '_blank') => {
      window.open(getAppHref(to, APPS.PROTONDRIVE, getLocalID()), target)
    },
    [getLocalID],
  )

  const openRecentSpreadsheets = useCallback(() => {
    window.open(getAppHref('/', APPS.PROTONSHEETS, getLocalID()), '_blank')
  }, [getLocalID])

  const openDriveFolderForDocument = useCallback(async () => {
    const node = documentState.getProperty('decryptedNode')
    const nodeMeta = documentState.getProperty('entitlements').nodeMeta
    let to: string | undefined
    if (!!privateContext && isPrivateNodeMeta(nodeMeta)) {
      const { compat } = privateContext
      // Drive is share-based and not volume-based so we need
      // to get and use the shareId (and not volumeId)
      const shareId = await compat.getShareId(nodeMeta)
      if (node.parentNodeId) {
        to = `/${shareId}/folder/${node.parentNodeId}`
      }
    }
    openProtonDrive(to)
  }, [documentState, openProtonDrive, privateContext])

  const handleSheetImportData = useCallback(
    (data: SheetImportData) => {
      void editorController.importDataIntoSheet(data)
    },
    [editorController],
  )

  const handleDownloadLogs = useCallback(() => {
    void downloadLogsAsJSON(editorController, documentType)
  }, [editorController, documentType])

  const openSheetImportModal = useCallback(() => {
    showSheetImportModal({
      handleImport: handleSheetImportData,
    })
  }, [handleSheetImportData, showSheetImportModal])

  const openMoveToFolderModal = useCallback(() => {
    authenticatedController?.openMoveToFolderModal()
  }, [authenticatedController])

  const trashDocument = useCallback(async () => {
    if (!authenticatedController) {
      throw new Error('Attempting to trash document in a public context')
    }
    try {
      await authenticatedController.trashDocument()
    } finally {
      close()
    }
  }, [authenticatedController, close])

  const showVersionHistory = useCallback(() => {
    if (!authenticatedController) {
      throw new Error('Attempting to view version history in a public context')
    }
    showHistoryModal({
      versionHistory: authenticatedController.getVersionHistory(),
      editorController,
      docController: authenticatedController,
      documentType,
      documentState,
    })
  }, [authenticatedController, editorController, documentType, showHistoryModal, documentState])

  const openHelp = useCallback(() => {
    window.open(getStaticURL('/support/drive/sheets'), '_blank')
  }, [])

  useEffect(() => {
    return application.eventBus.addEventCallback(async (data: FileMenuAction) => {
      switch (data.type) {
        case 'new-spreadsheet':
          return onNewDocument('sheet')
        case 'new-document':
          return onNewDocument('doc')
        case 'import':
          openSheetImportModal()
          return
        case 'make-a-copy':
          return onDuplicate()
        case 'move-to-folder':
          openMoveToFolderModal()
          break
        case 'see-version-history':
          showVersionHistory()
          break
        case 'move-to-trash':
          return trashDocument()
        case 'print':
          printAsPDF()
          break
        case 'help':
          openHelp()
          break
        case 'open-proton-drive':
          openProtonDrive()
          break
        case 'download':
          void editorController.exportAndDownload(data.format)
          break
        case 'view-recent-spreadsheets':
          openRecentSpreadsheets()
          break
        case 'toggle-debug-mode':
          toggleDebugMode()
          break
      }
    }, FileMenuActionEvent)
  }, [
    application.eventBus,
    onDuplicate,
    onNewDocument,
    openMoveToFolderModal,
    openSheetImportModal,
    showVersionHistory,
    trashDocument,
    printAsPDF,
    openHelp,
    openProtonDrive,
    editorController,
    openRecentSpreadsheets,
    toggleDebugMode,
  ])

  const canRename = documentState.getProperty('userRole').canRename()

  if (isSpreadsheet) {
    const input = (
      <Ariakit.TooltipProvider>
        <Ariakit.TooltipAnchor
          render={
            <input
              type="text"
              className={clsx(
                'text-ellipsis rounded-[4px] px-1 py-1.5 [border:1px_solid_transparent] focus-visible:outline-none enabled:focus:border-[#6D4AFF] enabled:hover:[&:not(:focus)]:bg-[#C2C1C033]',
                SupportsFieldSizing
                  ? 'ml-2 mr-1.5 min-w-4 [field-sizing:content]'
                  : 'w-auto max-w-full [grid-area:1_/_2]',
              )}
              value={renameInputValue}
              onChange={(e) => setRenameInputValue(e.target.value)}
              onKeyDown={(e) => {
                const { key, currentTarget } = e
                if (key === 'Escape') {
                  setRenameInputValue(title)
                  editorController.focusSpreadsheet()
                  e.preventDefault()
                  e.stopPropagation()
                } else if (key === 'Enter') {
                  currentTarget.blur()
                  editorController.focusSpreadsheet()
                }
              }}
              onBlur={confirmRename}
              ref={renameInputRef}
              data-testid="sheet-name-input"
              size={SupportsFieldSizing ? undefined : 1} // required to make sure the input will shrink to fit the content when `field-sizing` is not supported
              disabled={!canRename}
            />
          }
        ></Ariakit.TooltipAnchor>
        <UI.Tooltip>{c('Action').t`Rename`}</UI.Tooltip>
      </Ariakit.TooltipProvider>
    )

    return (
      <>
        {SupportsFieldSizing ? (
          input
        ) : (
          <div className="relative ml-2 mr-1.5 inline-grid items-center">
            {input}
            <div
              className="w-auto select-none overflow-hidden whitespace-pre border px-1 py-1.5 [grid-area:1_/_2] [visibility:hidden]"
              aria-hidden="true"
            >
              {renameInputValue}
            </div>
          </div>
        )}
        {historyModal}
        {pdfModal}
        {sheetImportModal}
        {authenticatedController && isDocumentState(documentState) && (
          <TrashedDocumentModal
            documentTitle={title || ''}
            onOpenProtonDrive={() => openProtonDrive('/', '_self')}
            controller={authenticatedController}
            documentState={documentState}
          />
        )}
      </>
    )
  }

  if (isRenaming) {
    return (
      <div className="flex items-center px-1.5 pl-1">
        <AutoGrowingInput
          inputClassName="px-1 py-1.5"
          ref={focusInputOnMount}
          value={renameInputValue}
          onValue={setRenameInputValue}
          onKeyDown={({ key }) => {
            if (key === 'Escape') {
              setIsRenaming(false)
              setRenameInputValue(title)
            } else if (key === 'Enter') {
              confirmRename()
            }
          }}
          onBlur={confirmRename}
        />
      </div>
    )
  }

  if (!title) {
    return
  }

  return (
    <>
      <DropdownButton
        ref={anchorRef}
        isOpen={isOpen}
        onClick={toggle}
        hasCaret
        shape="ghost"
        size="small"
        className="w-fit whitespace-nowrap px-1.5 py-1.5"
        data-testid="document-name-dropdown"
      >
        <span className="text-ellipsis text-left head-480-749:!max-w-[215px]">{title}</span>
      </DropdownButton>
      <Dropdown
        isOpen={isOpen}
        anchorRef={anchorRef}
        onClose={close}
        size={{
          width: DropdownSizeUnit.Dynamic,
          height: DropdownSizeUnit.Dynamic,
          maxHeight: DropdownSizeUnit.Viewport,
        }}
        originalPlacement="bottom-start"
        className="py-0"
        contentProps={{
          className: 'after:!h-0',
        }}
      >
        <DropdownMenu>
          {user && canRename && (
            <DropdownMenuButton
              className="flex items-center text-left"
              onClick={() => setIsRenaming((renaming) => !renaming)}
              data-testid="dropdown-rename"
            >
              <Icon name="pencil" className="color-weak mr-2" />
              {c('Action').t`Rename document`}
            </DropdownMenuButton>
          )}

          {!isPublicMode && (
            <DropdownMenuButton
              disabled={isMakingNewDocument}
              className="flex items-center text-left"
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                void onNewDocument()
              }}
              data-testid="dropdown-new-document"
            >
              <Icon name="brand-proton-docs" className="color-weak mr-2" />
              {c('Action').t`New document`}
              {isMakingNewDocument && <CircleLoader size="small" className="ml-auto" />}
            </DropdownMenuButton>
          )}

          {!isPublicMode && isSheetsEnabled ? (
            <DropdownMenuButton
              disabled={isMakingNewSheetDocument}
              className="flex items-center text-left"
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                void onNewDocument('sheet')
              }}
            >
              <Icon name="brand-proton-sheets" className="color-weak mr-2" />
              {c('sheets_2025:Action').t`New spreadsheet`}
              {isMakingNewSheetDocument ? <CircleLoader size="small" className="ml-auto" /> : null}
            </DropdownMenuButton>
          ) : null}

          {isSpreadsheet && documentState.getProperty('userRole').canEdit() && (
            <DropdownMenuButton
              className="flex items-center text-left"
              data-testid="dropdown-sheet-import"
              onClick={openSheetImportModal}
            >
              <Icon name="file-arrow-in-up" className="color-weak mr-2" />
              {c('Action').t`Import`}
            </DropdownMenuButton>
          )}

          {!isPublicMode && (
            <DropdownMenuButton
              disabled={isDuplicating}
              className="flex items-center text-left"
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                void onDuplicate()
              }}
              data-testid="dropdown-duplicate"
            >
              <Icon name="squares" className="color-weak mr-2" />
              {c('Action').t`Make a copy`}
              {isDuplicating && <CircleLoader size="small" className="ml-auto" />}
            </DropdownMenuButton>
          )}

          {!isPublicMode && authenticatedController && (
            <DropdownMenuButton
              className="flex items-center text-left"
              data-testid="dropdown-move-to-folder"
              onClick={openMoveToFolderModal}
            >
              <Icon name="arrows-cross" className="color-weak mr-2" />
              {c('Action').t`Move to folder`}
            </DropdownMenuButton>
          )}

          {!isPublicMode && (
            <DropdownMenuButton
              className="flex items-center text-left"
              onClick={showVersionHistory}
              data-testid="dropdown-versioning"
            >
              <Icon name="clock-rotate-left" className="color-weak mr-2" />
              {c('Action').t`See version history`}
            </DropdownMenuButton>
          )}

          {isWordCountSupported && !isSpreadsheet && (
            <SimpleDropdown
              as={DropdownMenuButton}
              className="flex items-center text-left"
              data-testid="dropdown-word-count"
              content={
                <>
                  <WordCountIcon className="color-weak mr-2 h-4 w-4" />
                  {c('Action').t`Word count`}
                  <span className="ml-auto text-[--text-hint]">{wordCount.document?.wordCount}</span>
                  <Icon name="chevron-right-filled" className="ml-2" />
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
              <DropdownMenu>
                <DropdownMenuButton
                  className="flex items-center gap-1 text-left"
                  onClick={(event) => {
                    event.preventDefault()
                    event.stopPropagation()
                  }}
                  data-testid="word-count-label"
                >
                  <span className="text-bold">{wordCount.document?.wordCount} </span> {c('Info').t`words`}
                </DropdownMenuButton>
                <DropdownMenuButton
                  className="flex items-center gap-1 text-left"
                  onClick={(event) => {
                    event.preventDefault()
                    event.stopPropagation()
                  }}
                  data-testid="character-count-label"
                >
                  <span className="text-bold">{wordCount.document?.characterCount}</span> {c('Info').t`characters`}
                </DropdownMenuButton>
                <DropdownMenuButton
                  className="flex items-center gap-1 text-left"
                  onClick={(event) => {
                    event.preventDefault()
                    event.stopPropagation()
                  }}
                  data-testid="non-whitespace-character-count-label"
                >
                  <span className="text-bold">{wordCount.document?.nonWhitespaceCharacterCount}</span>
                  {c('Info').t`characters without spaces`}
                </DropdownMenuButton>
                <DropdownMenuButton
                  className="flex items-center gap-1 text-left"
                  onClick={(event) => {
                    wordCount.setEnabled((value) => !value)
                    event.preventDefault()
                    event.stopPropagation()
                  }}
                  data-testid="non-whitespace-character-count-label"
                >
                  {c('Info').t`Display word count`}
                  <Toggle data-testid="floating-word-count-toggle" className="ml-auto" checked={wordCount.enabled} />
                </DropdownMenuButton>
              </DropdownMenu>
            </SimpleDropdown>
          )}

          {documentState.getProperty('userRole').canTrash() && (
            <DropdownMenuButton
              disabled={trashState === 'trashing' || trashState === 'trashed'}
              data-testid="dropdown-trash"
              onClick={(event) => {
                event.preventDefault()
                event.stopPropagation()
                void trashDocument()
              }}
              className="flex items-center text-left"
            >
              <Icon name="trash" className="color-weak mr-2" />
              {c('Action').t`Move to trash`}
              {trashState === 'trashing' && <CircleLoader size="small" className="ml-auto" />}
            </DropdownMenuButton>
          )}
          <hr className="my-1 min-h-px" />

          <DropdownMenuButton className="flex items-center text-left" onClick={printAsPDF} data-testid="dropdown-print">
            <Icon name="printer" className="color-weak mr-2" />
            {c('Action').t`Print`}
          </DropdownMenuButton>

          <SimpleDropdown
            as={DropdownMenuButton}
            className="flex items-center text-left"
            data-testid="dropdown-download"
            content={
              <>
                <Icon name="arrow-down-to-square" className="color-weak mr-2" />
                {c('Action').t`Download`}
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
            {isSpreadsheet && (
              <DropdownMenu>
                <DropdownMenuButton
                  className="flex items-center text-left"
                  onClick={() => {
                    void editorController.exportAndDownload('xlsx')
                  }}
                  data-testid="download-xlsx"
                >
                  {c('sheets_2025:Action').t`Microsoft Excel (.xlsx)`}
                </DropdownMenuButton>
                <DropdownMenuButton
                  className="flex items-center text-left"
                  onClick={() => {
                    void editorController.exportAndDownload('csv')
                  }}
                  data-testid="download-csv"
                >
                  {c('sheets_2025:Action').t`Comma Separated Values (.csv)`}
                </DropdownMenuButton>
                <DropdownMenuButton
                  className="flex items-center text-left"
                  onClick={() => {
                    void editorController.exportAndDownload('tsv')
                  }}
                  data-testid="download-tsv"
                >
                  {c('sheets_2025:Action').t`Tab Separated Values (.tsv)`}
                </DropdownMenuButton>
              </DropdownMenu>
            )}
            {!isSpreadsheet && (
              <DropdownMenu>
                <DropdownMenuButton
                  className="flex items-center text-left"
                  onClick={() => {
                    void editorController.exportAndDownload('docx')
                  }}
                  data-testid="download-docx"
                >
                  {c('Action').t`Microsoft Word (.docx)`}
                </DropdownMenuButton>
                <DropdownMenuButton
                  className="flex items-center text-left"
                  onClick={() => {
                    void editorController.exportAndDownload('html')
                  }}
                  data-testid="download-html"
                >
                  {c('Action').t`Web page (.html)`}
                </DropdownMenuButton>
                <DropdownMenuButton
                  className="flex items-center text-left"
                  onClick={() => {
                    void editorController.exportAndDownload('txt')
                  }}
                  data-testid="download-txt"
                >
                  {c('Action').t`Plain Text (.txt)`}
                </DropdownMenuButton>
                <DropdownMenuButton
                  className="flex items-center text-left"
                  onClick={() => {
                    void editorController.exportAndDownload('md')
                  }}
                  data-testid="download-md"
                >
                  {c('Action').t`Markdown (.md)`}
                </DropdownMenuButton>
                <DropdownMenuButton
                  className="flex items-center text-left"
                  onClick={onExportPDF}
                  data-testid="download-pdf"
                >
                  {c('Action').t`PDF (.pdf)`}
                </DropdownMenuButton>
              </DropdownMenu>
            )}
          </SimpleDropdown>

          {!isSpreadsheet && (
            <DropdownMenuButton
              className="flex items-center text-left"
              onClick={() => {
                void editorController.copyCurrentSelection('md')
              }}
              data-testid="dropdown-copy-as-md"
            >
              <Icon name="squares" className="color-weak mr-2" />
              {c('Action').t`Copy as markdown`}
            </DropdownMenuButton>
          )}

          <hr className="my-1 min-h-px" />

          <DropdownMenuButton className="flex items-center text-left" onClick={openHelp} data-testid="dropdown-help">
            <Icon name="info-circle" className="color-weak mr-2" />
            {c('Action').t`Help`}
            {showVersionNumber && <span className="ml-auto text-[--text-hint]">v{APP_VERSION}</span>}
          </DropdownMenuButton>

          <DropdownMenuButton
            className="flex items-center text-left"
            onClick={openDriveFolderForDocument}
            data-testid="dropdown-open-drive"
          >
            <Icon name="brand-proton-drive" className="color-weak mr-2" />
            {c('Action').t`Open ${DRIVE_APP_NAME}`}
          </DropdownMenuButton>

          {isDownloadLogsAllowed && (
            <DropdownMenuButton
              className="flex items-center text-left"
              onClick={handleDownloadLogs}
              data-testid="dropdown-download-logs"
            >
              <Icon name="arrow-down-to-square" className="color-weak mr-2" />
              {c('Action').t`Download logs`}
            </DropdownMenuButton>
          )}

          {showDebugToggle && (
            <DropdownMenuButton
              className="flex items-center text-left"
              onClick={toggleDebugMode}
              data-testid="dropdown-download-logs"
            >
              <Icon name="cog-wheel" className="color-weak mr-2" />
              {c('Action').t`Toggle debug mode`}
            </DropdownMenuButton>
          )}

          <hr className="mb-0 mt-1 min-h-px" />

          <div
            className="color-weak px-4 py-2 text-sm"
            style={{
              background: 'var(--primary-minor-2)',
            }}
            data-testid="e2e-info"
          >
            <Icon name="lock-check" className="color-weak mr-2 align-middle" />
            <span className="align-middle">{c('Info').t`End-to-end encrypted.`} </span>
            <a
              data-connection-popover
              className="mr-2 inline-block align-middle underline hover:underline"
              href="https://proton.me/security/end-to-end-encryption"
              target="_blank"
              rel="noreferrer"
            >
              {c('Info').t`Learn more`}
            </a>
          </div>
        </DropdownMenu>
      </Dropdown>

      {historyModal}
      {pdfModal}
      {sheetImportModal}
      {authenticatedController && isDocumentState(documentState) && (
        <TrashedDocumentModal
          documentTitle={title}
          onOpenProtonDrive={() => openProtonDrive('/', '_self')}
          controller={authenticatedController}
          documentState={documentState}
        />
      )}
    </>
  )
}
