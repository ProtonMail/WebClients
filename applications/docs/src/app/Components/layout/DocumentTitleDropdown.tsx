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
  MimeIcon,
  SimpleDropdown,
  Toggle,
  useAppTitle,
  useAuthentication,
  usePopperAnchor,
} from '@proton/components'
import type { AuthenticatedDocControllerInterface, DocumentState, PublicDocumentState } from '@proton/docs-core'
import { isDocumentState, PostApplicationError } from '@proton/docs-core'
import { type DocTrashState, isWordCountSupported } from '@proton/docs-shared'
import type { DocumentAction } from '@proton/drive-store'
import { getAppHref } from '@proton/shared/lib/apps/helper'
import { APPS, DRIVE_APP_NAME } from '@proton/shared/lib/constants'
import { getStaticURL } from '@proton/shared/lib/helpers/url'
import { useApplication } from '../../Containers/ApplicationProvider'
import WordCountIcon from '../../Icons/WordCountIcon'
import { AutoGrowingInput } from '../AutoGrowingInput'
import { useHistoryViewerModal } from '../History/HistoryViewer'
import { TrashedDocumentModal } from '../TrashedDocumentModal'
import { useFloatingWordCount } from '../WordCount/useFloatingWordCount'
import { useWordCount } from '../WordCount/useWordCount'
import type { EditorControllerInterface } from '@proton/docs-core'
import { useExportToPDFModal } from '../Modals/ExportToPDFModal/ExportToPDFModal'

const DocumentTitleDropdown = ({
  authenticatedController,
  editorController,
  documentState,
  action,
}: {
  authenticatedController: AuthenticatedDocControllerInterface | undefined
  editorController: EditorControllerInterface
  documentState: DocumentState | PublicDocumentState
  action?: DocumentAction['mode']
}) => {
  const application = useApplication()
  const isPublicMode = application.isPublicMode
  const { getLocalID } = useAuthentication()
  const wordCountInfoCollection = useWordCount()
  const { floatingUIIsEnabled, setFloatingUIIsEnabled } = useFloatingWordCount()
  const [title, setTitle] = useState<string | undefined>(documentState.getProperty('documentName'))
  const [isDuplicating, setIsDuplicating] = useState<boolean>(false)
  const [trashState, setTrashState] = useState<DocTrashState | undefined>(
    documentState.getProperty('documentTrashState'),
  )
  const [isMakingNewDocument, setIsMakingNewDocument] = useState<boolean>(false)
  const [pdfModal, openPdfModal] = useExportToPDFModal()
  const [historyModal, showHistoryModal] = useHistoryViewerModal()

  const [isRenaming, setIsRenaming] = useState(false)
  const [renameInputValue, setRenameInputValue] = useState(title)
  useEffect(() => {
    setRenameInputValue(title)
  }, [title])

  useAppTitle(title)

  const confirmRename = useCallback(() => {
    if (!authenticatedController) {
      throw new Error('Attempting to rename document in a public context')
    }

    const oldName = title
    const newName = renameInputValue?.trim()
    if (newName) {
      setIsRenaming(false)

      if (oldName !== newName) {
        void authenticatedController.renameDocument(newName).then((result) => {
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
  }, [application.eventBus, authenticatedController, renameInputValue, title])

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

  const onExportPDF = useCallback(
    (event: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
      event.preventDefault()
      event.stopPropagation()

      void openPdfModal({ onClose: () => editorController.printAsPDF() })
    },
    [openPdfModal, editorController],
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

      void authenticatedController?.createNewDocument().finally(() => {
        setIsMakingNewDocument(false)
      })
    },
    [authenticatedController],
  )

  useEffect(() => {
    if (action === 'history') {
      if (!authenticatedController) {
        throw new Error('Attempting to view version history in a public context')
      }

      showHistoryModal({
        versionHistory: authenticatedController.getVersionHistory(),
        editorController,
        docController: authenticatedController,
      })
    }
  }, [authenticatedController, action, showHistoryModal, editorController])

  const { anchorRef, isOpen, toggle, close } = usePopperAnchor<HTMLButtonElement>()
  const focusInputOnMount = useCallback((input: HTMLInputElement | null) => {
    if (input) {
      input.focus()
    }
  }, [])

  if (isRenaming) {
    return (
      <div className="flex items-center px-1.5">
        <MimeIcon name="proton-doc" size={5} className="mr-0.5" />
        <AutoGrowingInput
          className="text-sm"
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

  const openProtonDrive = (to = '/', target = '_blank') => {
    window.open(getAppHref(to, APPS.PROTONDRIVE, getLocalID()), target)
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
        <MimeIcon name="proton-doc" size={5} className="mr-2 shrink-0" />
        <span className="text-ellipsis text-left text-sm head-480-749:max-w-[215px]">{title}</span>
      </DropdownButton>
      <Dropdown
        isOpen={isOpen}
        anchorRef={anchorRef}
        onClose={close}
        size={{
          width: DropdownSizeUnit.Static,
        }}
        originalPlacement="bottom-start"
        className="py-0"
        contentProps={{
          className: 'after:h-0',
        }}
      >
        <DropdownMenu className="text-sm">
          {authenticatedController && documentState.getProperty('userRole').canEdit() && (
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
              onClick={onNewDocument}
              data-testid="dropdown-new-document"
            >
              <Icon name="file" className="color-weak mr-2" />
              {c('Action').t`New document`}
              {isMakingNewDocument && <CircleLoader size="small" className="ml-auto" />}
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
                })
              }}
              data-testid="dropdown-versioning"
            >
              <Icon name="clock-rotate-left" className="color-weak mr-2" />
              {c('Action').t`See version history`}
            </DropdownMenuButton>
          )}

          {isWordCountSupported && (
            <SimpleDropdown
              as={DropdownMenuButton}
              className="flex items-center text-left"
              data-testid="dropdown-word-count"
              content={
                <>
                  <WordCountIcon className="color-weak mr-2 h-4 w-4" />
                  {c('Action').t`Word count`}
                  <span className="ml-auto text-[--text-hint]">{wordCountInfoCollection.document?.wordCount}</span>
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
              <DropdownMenu className="text-sm">
                <DropdownMenuButton
                  className="flex items-center gap-1 text-left"
                  onClick={(event) => {
                    event.preventDefault()
                    event.stopPropagation()
                  }}
                  data-testid="word-count-label"
                >
                  <span className="text-bold">{wordCountInfoCollection.document?.wordCount} </span> {c('Info').t`words`}
                </DropdownMenuButton>
                <DropdownMenuButton
                  className="flex items-center gap-1 text-left"
                  onClick={(event) => {
                    event.preventDefault()
                    event.stopPropagation()
                  }}
                  data-testid="character-count-label"
                >
                  <span className="text-bold">{wordCountInfoCollection.document?.characterCount}</span>{' '}
                  {c('Info').t`characters`}
                </DropdownMenuButton>
                <DropdownMenuButton
                  className="flex items-center gap-1 text-left"
                  onClick={(event) => {
                    event.preventDefault()
                    event.stopPropagation()
                  }}
                  data-testid="non-whitespace-character-count-label"
                >
                  <span className="text-bold">{wordCountInfoCollection.document?.nonWhitespaceCharacterCount}</span>
                  {c('Info').t`characters without spaces`}
                </DropdownMenuButton>
                <DropdownMenuButton
                  className="flex items-center gap-1 text-left"
                  onClick={(event) => {
                    setFloatingUIIsEnabled(!floatingUIIsEnabled)
                    event.preventDefault()
                    event.stopPropagation()
                  }}
                  data-testid="non-whitespace-character-count-label"
                >
                  {c('Info').t`Display word count`}
                  <Toggle data-testid="floating-word-count-toggle" className="ml-auto" checked={floatingUIIsEnabled} />
                </DropdownMenuButton>
              </DropdownMenu>
            </SimpleDropdown>
          )}
          {documentState.getProperty('userRole').isAdmin() && (
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

          <DropdownMenuButton
            className="flex items-center text-left"
            onClick={() => {
              void editorController.printAsPDF()
            }}
            data-testid="dropdown-print"
          >
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
            <DropdownMenu className="text-sm">
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
          </SimpleDropdown>

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
          </DropdownMenuButton>

          <DropdownMenuButton
            className="flex items-center text-left"
            onClick={() => openProtonDrive()}
            data-testid="dropdown-open-drive"
          >
            <Icon name="brand-proton-drive" className="color-weak mr-2" />
            {c('Action').t`Open ${DRIVE_APP_NAME}`}
          </DropdownMenuButton>

          <hr className="mt-1 min-h-px" />

          <div
            className="color-weak px-4 py-2 text-xs"
            style={{
              background: 'var(--primary-minor-2)',
            }}
            data-testid="e2e-info"
          >
            <Icon name="lock-check" className="color-weak mr-2 align-middle" />
            <span className="align-middle">{c('Info').t`End-to-end encrypted.`} </span>
            <a
              data-connection-popover
              className="inline-block align-middle underline hover:underline"
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

export default DocumentTitleDropdown
