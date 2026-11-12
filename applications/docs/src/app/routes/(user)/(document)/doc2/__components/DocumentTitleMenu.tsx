import { type MouseEvent, type ReactNode, useCallback, useEffect, useRef, useState } from 'react'

import { useConfig } from '@proton/app-context/useConfig'
import { useNotifications } from '@proton/app-context/useNotifications'
import { CircleLoader } from '@proton/atoms/CircleLoader/CircleLoader'
import { usePopperAnchor } from '@proton/atoms/Popper/usePopperAnchor'
import { Tooltip } from '@proton/atoms/Tooltip/Tooltip'
import Dropdown from '@proton/components/components/dropdown/Dropdown'
import DropdownButton from '@proton/components/components/dropdown/DropdownButton'
import DropdownMenu from '@proton/components/components/dropdown/DropdownMenu'
import DropdownMenuButton from '@proton/components/components/dropdown/DropdownMenuButton'
import SimpleDropdown from '@proton/components/components/dropdown/SimpleDropdown'
import { DropdownSizeUnit } from '@proton/components/components/dropdown/utils'
import Toggle from '@proton/components/components/toggle/Toggle'
import { getAppVersion } from '@proton/components/helpers/appVersion'
import { versionCookieAtLoad } from '@proton/account/earlyAccess/versionCookie'
import useAppTitle from '@proton/components/hooks/useAppTitle'
import type { FileMenuAction } from '@proton/docs-shared/Bridge/EditorRequiresClientMethods'
import type { DataTypesThatDocumentCanBeExportedAs } from '@proton/docs-shared/ExportableDataType'
import { isWordCountSupported } from '@proton/docs-shared/WordCount/isWordCountSupported'
import { VersionNumber } from '@proton/docs-shared/components/ui/VersionNumber'
import type { NodeEntity } from '@proton/drive/sdk'
import { IcArrowDownToSquare } from '@proton/icons/icons/IcArrowDownToSquare'
import { IcArrowsCross } from '@proton/icons/icons/IcArrowsCross'
import { IcBrandProtonDocs } from '@proton/icons/icons/IcBrandProtonDocs'
import { IcBrandProtonDrive } from '@proton/icons/icons/IcBrandProtonDrive'
import { IcBrandProtonSheets } from '@proton/icons/icons/IcBrandProtonSheets'
import { IcChevronRightFilled } from '@proton/icons/icons/IcChevronRightFilled'
import { IcClockRotateLeft } from '@proton/icons/icons/IcClockRotateLeft'
import { IcCogWheel } from '@proton/icons/icons/IcCogWheel'
import { IcInfoCircle } from '@proton/icons/icons/IcInfoCircle'
import { IcListBullets } from '@proton/icons/icons/IcListBullets'
import { IcLockCheck } from '@proton/icons/icons/IcLockCheck'
import { IcPencil } from '@proton/icons/icons/IcPencil'
import { IcPrinter } from '@proton/icons/icons/IcPrinter'
import { IcSquares } from '@proton/icons/icons/IcSquares'
import { IcTrash } from '@proton/icons/icons/IcTrash'
import { DRIVE_APP_NAME } from '@proton/shared/lib/constants'
import { textToClipboard } from '@proton/shared/lib/helpers/browser'
import { c } from 'ttag'

import { AutoGrowingInput } from '~/components/document/DocumentLayout/DocumentHeader/DocumentTitleDropdown/AutoGrowingInput'
import { WordCountIcon } from '~/components/document/DocumentLayout/DocumentHeader/icons'
import { useApplication } from '~/utils/application-context'
import { useIsDownloadLogsAllowed, useIsODTEnabled, useIsSheetsEnabled } from '~/utils/flags'
import type { EditorInvoker } from '../__utils/EditorInvoker'
import { downloadLogs } from '../__utils/debugDownloads'
import type { DocumentRole } from '../__utils/getDocumentRole'
import { getNodeName } from '../__utils/getNodeName'
import { renameDocument } from '../__utils/renameDocument'
import type { TrashState } from '../__utils/useDocumentFileActions'
import { useExportToPDFModal } from './ExportToPDFModal'
import type { WordCount } from './WordCount'

export type DocumentTitleMenuProps = {
  node: Pick<NodeEntity, 'uid' | 'parentUid' | 'name'>
  role: DocumentRole
  editorInvoker:
    Pick<EditorInvoker, 'setTableOfContentsVisible' | 'getYDocAsJSON' | 'getCurrentEditorState'> | undefined
  /** The editor once it shows the document; until then Make a copy, Print, Download and Copy as markdown are disabled */
  exportInvoker: Pick<EditorInvoker, 'getCurrentSelection'> | undefined
  wordCount: WordCount
  trashState: TrashState
  isCreatingSpreadsheet: boolean
  isMakingACopy: boolean
  onFileMenuAction: (action: FileMenuAction) => void
}

/**
 * The document name, which opens /doc's title menu (`DocumentTitleDropdown.tsx`) with every docs item in its order.
 * See version history is a stub; the sheets-only items are left out.
 */
export function DocumentTitleMenu({
  node,
  role,
  editorInvoker,
  exportInvoker,
  wordCount,
  trashState,
  isCreatingSpreadsheet,
  isMakingACopy,
  onFileMenuAction,
}: DocumentTitleMenuProps) {
  const { logger } = useApplication()
  const { APP_VERSION } = useConfig()
  const { createNotification } = useNotifications()
  const isSheetsEnabled = useIsSheetsEnabled()
  const isDownloadLogsAllowed = useIsDownloadLogsAllowed()
  const isODTEnabled = useIsODTEnabled()
  const [pdfModal, openPdfModal] = useExportToPDFModal()
  const { anchorRef, isOpen, toggle, close } = usePopperAnchor<HTMLButtonElement>()

  const [title, setTitle] = useState(() => getNodeName(node))
  // The latest name Drive reported or a rename got, which a failed rename rolls back to
  const latestNodeNameRef = useRef(title)
  // The name the edit started from and what the input holds: the edit renames only once they differ
  const [renameEdit, setRenameEdit] = useState<{ startName: string | undefined; value: string | undefined }>()
  // One rename at a time, so a late answer to an earlier one can't overwrite a later name
  const [isRenamePending, setIsRenamePending] = useState(false)
  const [tableOfContentsVisible, setTableOfContentsVisible] = useState(true)
  const [showVersionNumber, setShowVersionNumber] = useState(false)
  const [showDebugToggle, setShowDebugToggle] = useState(false)

  const canRename = role === 'Editor' || role === 'Admin'
  const canTrash = role === 'Admin'

  useAppTitle(title)

  // The node changes when Drive reports it renamed or moved elsewhere. An untouched rename input follows it.
  useEffect(() => {
    const name = getNodeName(node)
    latestNodeNameRef.current = name
    setTitle(name)
    setRenameEdit((edit) => (edit && edit.value === edit.startName ? { startName: name, value: name } : edit))
  }, [node])

  useEffect(() => {
    editorInvoker
      ?.setTableOfContentsVisible(tableOfContentsVisible)
      .catch((error) => logger.warn('Failed to show or hide the table of contents', error))
  }, [editorInvoker, logger, tableOfContentsVisible])

  useEffect(() => {
    // Holding Shift shows the version number, and Ctrl+Shift also shows the debug mode toggle
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.shiftKey) {
        setShowVersionNumber(true)
        if (event.ctrlKey) {
          setShowDebugToggle((shown) => !shown)
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

  useEffect(() => {
    if (!isOpen) {
      setShowDebugToggle(false)
    }
  }, [isOpen])

  const focusInputOnMount = useCallback((input: HTMLInputElement | null) => {
    input?.focus()
    input?.select()
  }, [])

  const cancelRename = () => setRenameEdit(undefined)

  const copyAsMarkdown = () => {
    exportInvoker?.getCurrentSelection('md').then(
      (markdown) => {
        if (markdown) {
          textToClipboard(markdown)
          createNotification({ type: 'success', text: c('Info').t`Copied to clipboard` })
        }
      },
      (error) => logger.error('Failed to copy the document as Markdown', error),
    )
  }

  const confirmRename = () => {
    const typedName = renameEdit?.value?.trim()
    if (!typedName || typedName === renameEdit?.startName?.trim() || typedName === title) {
      cancelRename()
      return
    }
    cancelRename()
    setTitle(typedName)
    setIsRenamePending(true)
    // The name Drive gave the document, which differs from the typed one when that was taken
    renameDocument(node, typedName)
      .then(
        (newName) => {
          latestNodeNameRef.current = newName
          setTitle(newName)
          createNotification({
            text: <span className="text-pre-wrap">{c('Notification').jt`"${newName}" renamed successfully`}</span>,
          })
        },
        (error) => {
          logger.error('Failed to rename the document', error)
          setTitle(latestNodeNameRef.current)
          createNotification({ type: 'error', text: c('Error').t`Failed to rename document. Please try again later.` })
        },
      )
      .finally(() => setIsRenamePending(false))
  }

  if (renameEdit) {
    return (
      <div className="flex items-center px-1.5 pl-1">
        <AutoGrowingInput
          inputClassName="px-1 py-1.5"
          ref={focusInputOnMount}
          value={renameEdit.value}
          onValue={(value) => setRenameEdit((edit) => edit && { ...edit, value })}
          onKeyDown={({ key }) => {
            if (key === 'Escape') {
              cancelRename()
            } else if (key === 'Enter') {
              confirmRename()
            }
          }}
          onBlur={confirmRename}
          data-testid="rename-input"
        />
      </div>
    )
  }

  if (!title) {
    return null
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
        contentProps={{ className: 'after:!h-0' }}
      >
        <DropdownMenu>
          {canRename && (
            <DropdownMenuButton
              className="flex items-center text-left"
              disabled={isRenamePending}
              onClick={() => setRenameEdit({ startName: title, value: title })}
              data-testid="dropdown-rename"
            >
              <IcPencil className="color-weak mr-2" />
              {c('Action').t`Rename document`}
            </DropdownMenuButton>
          )}

          <DropdownMenuButton
            className="flex items-center text-left"
            onClick={() => onFileMenuAction({ type: 'new-document' })}
            data-testid="dropdown-new-document"
          >
            <IcBrandProtonDocs className="color-weak mr-2" />
            {c('Action').t`New document`}
          </DropdownMenuButton>

          {isSheetsEnabled && (
            <DropdownMenuButton
              className="flex items-center text-left"
              disabled={isCreatingSpreadsheet}
              onClick={() => onFileMenuAction({ type: 'new-spreadsheet' })}
              data-testid="dropdown-new-spreadsheet"
            >
              <IcBrandProtonSheets className="color-weak mr-2" />
              {c('sheets_2025:Action').t`New spreadsheet`}
              {isCreatingSpreadsheet && <CircleLoader size="small" className="ml-auto" />}
            </DropdownMenuButton>
          )}

          <DropdownMenuButton
            className="flex items-center text-left"
            disabled={!exportInvoker || isMakingACopy}
            onClick={() => onFileMenuAction({ type: 'make-a-copy' })}
            data-testid="dropdown-duplicate"
          >
            <IcSquares className="color-weak mr-2" />
            {c('Action').t`Make a copy`}
            {isMakingACopy && <CircleLoader size="small" className="ml-auto" />}
          </DropdownMenuButton>

          <DropdownMenuButton
            className="flex items-center text-left"
            onClick={() => onFileMenuAction({ type: 'move-to-folder' })}
            data-testid="dropdown-move-to-folder"
          >
            <IcArrowsCross className="color-weak mr-2" />
            {c('Action').t`Move to folder`}
          </DropdownMenuButton>

          <StubMenuItem waitsFor="version history" icon={<IcClockRotateLeft />} data-testid="dropdown-versioning">
            {c('Action').t`See version history`}
          </StubMenuItem>

          {isWordCountSupported && <WordCountMenu wordCount={wordCount} />}

          <DropdownMenuButton
            className="flex items-center text-left"
            onClick={() => setTableOfContentsVisible((visible) => !visible)}
            data-testid="dropdown-table-of-contents"
          >
            <IcListBullets className="color-weak mr-2" />
            {tableOfContentsVisible ? c('Info').t`Hide table of contents` : c('Info').t`Show table of contents`}
          </DropdownMenuButton>

          {canTrash && (
            <DropdownMenuButton
              className="flex items-center text-left"
              disabled={trashState !== 'not_trashed'}
              onClick={() => onFileMenuAction({ type: 'move-to-trash' })}
              data-testid="dropdown-trash"
            >
              <IcTrash className="color-weak mr-2" />
              {c('Action').t`Move to trash`}
              {trashState === 'trashing' && <CircleLoader size="small" className="ml-auto" />}
            </DropdownMenuButton>
          )}

          <hr className="my-1 min-h-px" />

          <DropdownMenuButton
            className="flex items-center text-left"
            disabled={!exportInvoker}
            onClick={() => onFileMenuAction({ type: 'print' })}
            data-testid="dropdown-print"
          >
            <IcPrinter className="color-weak mr-2" />
            {c('Action').t`Print`}
          </DropdownMenuButton>

          <SimpleDropdown
            as={DropdownMenuButton}
            className="flex items-center text-left"
            disabled={!exportInvoker}
            data-testid="dropdown-download"
            content={
              <>
                <IcArrowDownToSquare className="color-weak mr-2" />
                {c('Action').t`Download`}
                <IcChevronRightFilled className="ml-auto" />
              </>
            }
            hasCaret={false}
            onClick={(event: MouseEvent) => {
              event.preventDefault()
              event.stopPropagation()
            }}
            originalPlacement="right-start"
            contentProps={{ offset: 0 }}
          >
            <DropdownMenu>
              {downloadFormats(isODTEnabled).map(({ format, label }) => (
                <DropdownMenuButton
                  key={format}
                  className="flex items-center text-left"
                  onClick={() => onFileMenuAction({ type: 'download', format })}
                  data-testid={`download-${format}`}
                >
                  {label}
                </DropdownMenuButton>
              ))}
              <DropdownMenuButton
                className="flex items-center text-left"
                onClick={() => openPdfModal({ onClose: () => onFileMenuAction({ type: 'print' }) })}
                data-testid="download-pdf"
              >
                {c('Action').t`PDF (.pdf)`}
              </DropdownMenuButton>
            </DropdownMenu>
          </SimpleDropdown>

          <DropdownMenuButton
            className="flex items-center text-left"
            disabled={!exportInvoker}
            onClick={copyAsMarkdown}
            data-testid="dropdown-copy-as-md"
          >
            <IcSquares className="color-weak mr-2" />
            {c('Action').t`Copy as markdown`}
          </DropdownMenuButton>

          <hr className="my-1 min-h-px" />

          <DropdownMenuButton
            className="flex items-center text-left"
            onClick={() => onFileMenuAction({ type: 'help' })}
            data-testid="dropdown-help"
          >
            <IcInfoCircle className="color-weak mr-2" />
            {c('Action').t`Help`}
            {showVersionNumber && (
              <VersionNumber
                className="ml-auto text-[--text-hint]"
                version={getAppVersion(APP_VERSION)}
                environment={versionCookieAtLoad}
              />
            )}
          </DropdownMenuButton>

          <DropdownMenuButton
            className="flex items-center text-left"
            onClick={() => onFileMenuAction({ type: 'open-proton-drive' })}
            data-testid="dropdown-open-drive"
          >
            <IcBrandProtonDrive className="color-weak mr-2" />
            {c('Action').t`Open ${DRIVE_APP_NAME}`}
          </DropdownMenuButton>

          {isDownloadLogsAllowed && (
            <DropdownMenuButton
              className="flex items-center text-left"
              disabled={!editorInvoker}
              onClick={() =>
                editorInvoker &&
                downloadLogs(editorInvoker).catch((error) => logger.error('Failed to download the logs', error))
              }
              data-testid="dropdown-download-logs"
            >
              <IcArrowDownToSquare className="color-weak mr-2" />
              {c('Action').t`Download logs`}
            </DropdownMenuButton>
          )}

          {showDebugToggle && (
            <DropdownMenuButton
              className="flex items-center text-left"
              onClick={() => onFileMenuAction({ type: 'toggle-debug-mode' })}
              data-testid="dropdown-toggle-debug-mode"
            >
              <IcCogWheel className="color-weak mr-2" />
              {c('Action').t`Toggle debug mode`}
            </DropdownMenuButton>
          )}

          <hr className="mb-0 mt-1 min-h-px" />

          <div
            className="color-weak px-4 py-2 text-sm"
            style={{ background: 'var(--primary-minor-2)' }}
            data-testid="e2e-info"
          >
            <IcLockCheck className="color-weak mr-2 align-middle" />
            <span className="align-middle">{c('Info').t`End-to-end encrypted.`} </span>
            <a
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
      {pdfModal}
    </>
  )
}

/** /doc's docs download formats, but PDF, which the editor doesn't export: it prints */
function downloadFormats(isODTEnabled: boolean): { format: DataTypesThatDocumentCanBeExportedAs; label: string }[] {
  return [
    { format: 'docx', label: c('Action').t`Microsoft Word (.docx)` },
    ...(isODTEnabled ? [{ format: 'odt' as const, label: c('Action').t`OpenDocument Text (.odt) (Beta)` }] : []),
    { format: 'html', label: c('Action').t`Web page (.html)` },
    { format: 'txt', label: c('Action').t`Plain Text (.txt)` },
    { format: 'md', label: c('Action').t`Markdown (.md)` },
  ]
}

/** What a stub waits for. Version history has no ticket: it is kept for later. */
type StubTicket = 'version history'

type StubMenuItemProps = { waitsFor: StubTicket; icon: ReactNode; children: ReactNode; 'data-testid': string }

/** A menu item doc2 doesn't have yet: shown disabled, with a tooltip saying so. */
function StubMenuItem({ waitsFor, icon, children, 'data-testid': testId }: StubMenuItemProps) {
  // Keeps the menu open, as a disabled item would
  const ignoreClick = (event: MouseEvent) => {
    event.preventDefault()
    event.stopPropagation()
  }
  return (
    <Tooltip title={c('Info').t`Not available yet`} originalPlacement="right">
      <DropdownMenuButton
        className="flex items-center text-left"
        fakeDisabled
        aria-disabled="true"
        onClick={ignoreClick}
        data-stub={waitsFor}
        data-testid={testId}
      >
        <span className="color-weak mr-2 flex">{icon}</span>
        <span>{children}</span>
      </DropdownMenuButton>
    </Tooltip>
  )
}

type WordCountMenuProps = { wordCount: WordCount }

function WordCountMenu({ wordCount }: WordCountMenuProps) {
  // Picking a count keeps the menu open
  const keepOpen = (event: MouseEvent) => {
    event.preventDefault()
    event.stopPropagation()
  }
  return (
    <SimpleDropdown
      as={DropdownMenuButton}
      className="flex items-center text-left"
      data-testid="dropdown-word-count"
      content={
        <>
          <WordCountIcon className="color-weak mr-2 h-4 w-4" />
          {c('Action').t`Word count`}
          <span className="ml-auto text-[--text-hint]">{wordCount.document?.wordCount}</span>
          <IcChevronRightFilled className="ml-2" />
        </>
      }
      hasCaret={false}
      onClick={keepOpen}
      originalPlacement="right-start"
      contentProps={{ offset: 0 }}
    >
      <DropdownMenu>
        <DropdownMenuButton
          className="flex items-center gap-1 text-left"
          onClick={keepOpen}
          data-testid="word-count-label"
        >
          <span className="text-bold">{wordCount.document?.wordCount} </span> {c('Info').t`words`}
        </DropdownMenuButton>
        <DropdownMenuButton
          className="flex items-center gap-1 text-left"
          onClick={keepOpen}
          data-testid="character-count-label"
        >
          <span className="text-bold">{wordCount.document?.characterCount}</span> {c('Info').t`characters`}
        </DropdownMenuButton>
        <DropdownMenuButton
          className="flex items-center gap-1 text-left"
          onClick={keepOpen}
          data-testid="non-whitespace-character-count-label"
        >
          <span className="text-bold">{wordCount.document?.nonWhitespaceCharacterCount}</span>
          {c('Info').t`characters without spaces`}
        </DropdownMenuButton>
        <DropdownMenuButton
          className="flex items-center gap-1 text-left"
          onClick={(event) => {
            keepOpen(event)
            wordCount.setIsShown((shown) => !shown)
          }}
          data-testid="display-word-count"
        >
          {c('Info').t`Display word count`}
          <Toggle data-testid="floating-word-count-toggle" className="ml-auto" checked={wordCount.isShown} />
        </DropdownMenuButton>
      </DropdownMenu>
    </SimpleDropdown>
  )
}
