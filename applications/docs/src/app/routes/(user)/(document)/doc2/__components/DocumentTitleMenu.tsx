import { type MouseEvent, type ReactNode, useCallback, useEffect, useRef, useState } from 'react'

import { useConfig } from '@proton/app-context/useConfig'
import { useNotifications } from '@proton/app-context/useNotifications'
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
import { versionCookieAtLoad } from '@proton/components/helpers/versionCookie'
import useAppTitle from '@proton/components/hooks/useAppTitle'
import type { FileMenuAction } from '@proton/docs-shared/Bridge/EditorRequiresClientMethods'
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
import { c } from 'ttag'

import { AutoGrowingInput } from '~/components/document/DocumentLayout/DocumentHeader/DocumentTitleDropdown/AutoGrowingInput'
import { WordCountIcon } from '~/components/document/DocumentLayout/DocumentHeader/icons'
import { useApplication } from '~/utils/application-context'
import { useIsDownloadLogsAllowed, useIsSheetsEnabled } from '~/utils/flags'
import type { EditorInvoker } from '../__utils/EditorInvoker'
import type { DocumentRole } from '../__utils/getDocumentRole'
import { getNodeName } from '../__utils/getNodeName'
import { renameDocument } from '../__utils/renameDocument'
import type { WordCount } from './WordCount'

export type DocumentTitleMenuProps = {
  node: Pick<NodeEntity, 'uid' | 'parentUid' | 'name'>
  role: DocumentRole
  editorInvoker: Pick<EditorInvoker, 'setTableOfContentsVisible'> | undefined
  wordCount: WordCount
  onFileMenuAction: (action: FileMenuAction) => void
}

/**
 * The document name, which opens /doc's title menu (`DocumentTitleDropdown.tsx`) with every docs item in its order.
 * Items whose doc2 ticket hasn't landed are stubs; the sheets-only ones are left out.
 */
export function DocumentTitleMenu({ node, role, editorInvoker, wordCount, onFileMenuAction }: DocumentTitleMenuProps) {
  const { logger } = useApplication()
  const { APP_VERSION } = useConfig()
  const { createNotification } = useNotifications()
  const isSheetsEnabled = useIsSheetsEnabled()
  const isDownloadLogsAllowed = useIsDownloadLogsAllowed()
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

          <StubMenuItem waitsFor="T6" icon={<IcBrandProtonDocs />} data-testid="dropdown-new-document">
            {c('Action').t`New document`}
          </StubMenuItem>

          {isSheetsEnabled && (
            <StubMenuItem waitsFor="T6" icon={<IcBrandProtonSheets />} data-testid="dropdown-new-spreadsheet">
              {c('sheets_2025:Action').t`New spreadsheet`}
            </StubMenuItem>
          )}

          <StubMenuItem waitsFor="T13" icon={<IcSquares />} data-testid="dropdown-duplicate">
            {c('Action').t`Make a copy`}
          </StubMenuItem>

          <StubMenuItem waitsFor="T6" icon={<IcArrowsCross />} data-testid="dropdown-move-to-folder">
            {c('Action').t`Move to folder`}
          </StubMenuItem>

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
            <StubMenuItem waitsFor="T6" icon={<IcTrash />} data-testid="dropdown-trash">
              {c('Action').t`Move to trash`}
            </StubMenuItem>
          )}

          <hr className="my-1 min-h-px" />

          <StubMenuItem waitsFor="T7" icon={<IcPrinter />} data-testid="dropdown-print">
            {c('Action').t`Print`}
          </StubMenuItem>

          <StubMenuItem waitsFor="T7" icon={<IcArrowDownToSquare />} data-testid="dropdown-download">
            {c('Action').t`Download`}
          </StubMenuItem>

          <StubMenuItem waitsFor="T7" icon={<IcSquares />} data-testid="dropdown-copy-as-md">
            {c('Action').t`Copy as markdown`}
          </StubMenuItem>

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

          <StubMenuItem waitsFor="T6" icon={<IcBrandProtonDrive />} data-testid="dropdown-open-drive">
            {c('Action').t`Open ${DRIVE_APP_NAME}`}
          </StubMenuItem>

          {isDownloadLogsAllowed && (
            <StubMenuItem waitsFor="T10" icon={<IcArrowDownToSquare />} data-testid="dropdown-download-logs">
              {c('Action').t`Download logs`}
            </StubMenuItem>
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
    </>
  )
}

/**
 * The doc2 plan ticket a stub waits for: T6 file actions and sharing, T7 download, print and export, T10 the debug
 * menu, T13 make a copy. Version history has no ticket: it is kept for later.
 */
type StubTicket = 'T6' | 'T7' | 'T10' | 'T13' | 'version history'

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
