import { useCallback, useEffect, useState } from 'react'

import { mergeRegister } from '@lexical/utils'
import { c } from 'ttag'

import { CircleLoader } from '@proton/atoms'
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
import type { AuthenticatedDocControllerInterface, DocumentState, PublicDocumentState } from '@proton/docs-core'
import { isDocumentState, PostApplicationError } from '@proton/docs-core'
import type { SheetImportData } from '@proton/docs-shared'
import { type DocTrashState, isWordCountSupported } from '@proton/docs-shared'
import { isPrivateNodeMeta, type DocumentAction } from '@proton/drive-store'
import { getAppHref } from '@proton/shared/lib/apps/helper'
import { APPS, APPS_CONFIGURATION, DRIVE_APP_NAME } from '@proton/shared/lib/constants'
import { getStaticURL } from '@proton/shared/lib/helpers/url'
import { useApplication } from '~/utils/application-context'
import { AutoGrowingInput } from './AutoGrowingInput'
import { useHistoryViewerModal } from '../HistoryViewerModal/HistoryViewerModal'
import { TrashedDocumentModal } from './TrashedDocumentModal'
import { useWordCount } from '../../../WordCount'
import type { EditorControllerInterface } from '@proton/docs-core'
import { useExportToPDFModal } from './ExportToPDFModal'
import type { RenameControllerInterface } from '@proton/docs-core'
import { useDocsContext } from '../../../context'
import { WordCountIcon } from '../icons'
import type { DocumentType } from '@proton/drive-store/store/_documents'
import { useSheetImportModal } from './SheetImportModal'
import { downloadLogsAsJSON } from '~/utils/downloadLogs'
import { useIsDownloadLogsAllowed } from '~/utils/misc'

export type DocumentTitleDropdownProps = {
  authenticatedController: AuthenticatedDocControllerInterface | undefined
  renameController: RenameControllerInterface | undefined
  editorController: EditorControllerInterface
  documentState: DocumentState | PublicDocumentState
  actionMode?: DocumentAction['mode']
  documentType: DocumentType
}

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
  const [pdfModal, openPdfModal] = useExportToPDFModal()
  const [historyModal, showHistoryModal] = useHistoryViewerModal()
  const [sheetImportModal, openSheetImportModal] = useSheetImportModal()
  const [showVersionNumber, setShowVersionNumber] = useState(false)
  const isDownloadLogsAllowed = useIsDownloadLogsAllowed()
  const { APP_VERSION } = useConfig()

  const [isRenaming, setIsRenaming] = useState(false)
  const [renameInputValue, setRenameInputValue] = useState(title)
  useEffect(() => {
    setRenameInputValue(title)
  }, [title])

  const isSpreadsheet = documentType === 'sheet'

  useAppTitle(title, isSpreadsheet ? APPS_CONFIGURATION[APPS.PROTONSHEETS].name : undefined)

  useEffect(() => {
    // When the user holds down the shift key, show the version number. When they release, hide it.
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.shiftKey) {
        setShowVersionNumber(true)
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

  const confirmRename = useCallback(() => {
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
  }, [application.eventBus, renameController, renameInputValue, title])

  const onDuplicate = useCallback(
    async (event: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
      if (!authenticatedController) {
        throw new Error('Attempting to duplicate document in a public context')
      }

      event.preventDefault()
      event.stopPropagation()

      setIsDuplicating(true)

      const editorState = await editorController?.exportData('yjs')
      if (editorState) {
        void authenticatedController.duplicateDocument(editorState).finally(() => {
          setIsDuplicating(false)
        })
      } else {
        setIsDuplicating(false)
      }
    },
    [authenticatedController, editorController],
  )

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
    (event: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
      event.preventDefault()
      event.stopPropagation()

      setIsMakingNewDocument(true)

      void authenticatedController?.createNewDocument(documentType).finally(() => {
        setIsMakingNewDocument(false)
      })
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
      })
    }
  }, [authenticatedController, actionMode, showHistoryModal, editorController, documentType])

  const { anchorRef, isOpen, toggle, close } = usePopperAnchor<HTMLButtonElement>()
  const focusInputOnMount = useCallback((input: HTMLInputElement | null) => {
    if (input) {
      input.focus()
    }
  }, [])

  const openProtonDrive = useCallback(
    (to = '/', target = '_blank') => {
      window.open(getAppHref(to, APPS.PROTONDRIVE, getLocalID()), target)
    },
    [getLocalID],
  )

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
          {user && documentState.getProperty('userRole').canRename() && (
            <DropdownMenuButton
              className="flex items-center text-left"
              onClick={() => setIsRenaming((renaming) => !renaming)}
              data-testid="dropdown-rename"
            >
              <Icon name="pencil" className="color-weak mr-2" />
              {isSpreadsheet ? c('sheets_2025:Action').t`Rename spreadsheet` : c('Action').t`Rename document`}
            </DropdownMenuButton>
          )}

          {!isPublicMode && (
            <DropdownMenuButton
              disabled={isMakingNewDocument}
              className="flex items-center text-left"
              onClick={onNewDocument}
              data-testid="dropdown-new-document"
            >
              <Icon name="file" className="color-weak mr-2" />
              {isSpreadsheet ? c('sheets_2025:Action').t`New spreadsheet` : c('Action').t`New document`}
              {isMakingNewDocument && <CircleLoader size="small" className="ml-auto" />}
            </DropdownMenuButton>
          )}

          {isSpreadsheet && (
            <DropdownMenuButton
              className="flex items-center text-left"
              data-testid="dropdown-sheet-import"
              onClick={() => {
                openSheetImportModal({
                  handleImport: handleSheetImportData,
                })
              }}
            >
              <Icon name="file-arrow-in-up" className="color-weak mr-2" />
              {c('Action').t`Import`}
            </DropdownMenuButton>
          )}

          {!isPublicMode && (
            <DropdownMenuButton
              disabled={isDuplicating}
              className="flex items-center text-left"
              onClick={onDuplicate}
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
              onClick={() => authenticatedController.openMoveToFolderModal()}
            >
              <Icon name="arrows-cross" className="color-weak mr-2" />
              {c('Action').t`Move to folder`}
            </DropdownMenuButton>
          )}

          {!isPublicMode && (
            <DropdownMenuButton
              className="flex items-center text-left"
              onClick={() => {
                if (!authenticatedController) {
                  throw new Error('Attempting to view version history in a public context')
                }

                showHistoryModal({
                  versionHistory: authenticatedController.getVersionHistory(),
                  editorController,
                  docController: authenticatedController,
                  documentType,
                })
              }}
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
                if (!authenticatedController) {
                  throw new Error('Attempting to trash document in a public context')
                }

                event.preventDefault()
                event.stopPropagation()

                void authenticatedController.trashDocument().finally(() => {
                  close()
                })
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

          <DropdownMenuButton
            className="flex items-center text-left"
            onClick={() => {
              window.open(getStaticURL('/support'), '_blank')
            }}
            data-testid="dropdown-help"
          >
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
