import {
  Dropdown,
  DropdownButton,
  DropdownMenu,
  DropdownMenuButton,
  DropdownSizeUnit,
  Icon,
  SimpleDropdown,
  useAppTitle,
  usePopperAnchor,
} from '@proton/components'
import { useCallback, useEffect, useState } from 'react'
import {
  DocControllerEvent,
  DocControllerEventPayloads,
  DocControllerInterface,
  PostApplicationError,
} from '@proton/docs-core'
import { useHistoryViewerModal } from '../HistoryViewer'
import { c } from 'ttag'
import { useApplication } from '../../Containers/ApplicationProvider'
import { CircleLoader } from '@proton/atoms/CircleLoader'
import documentIcon from '@proton/styles/assets/img/drive/file-document-proton.svg'
import { DocumentAction } from '@proton/drive-store'
import { AutoGrowingInput } from '../AutoGrowingInput'
import { APPS, DRIVE_APP_NAME } from '@proton/shared/lib/constants'
import { getStaticURL } from '@proton/shared/lib/helpers/url'
import { getAppHref } from '@proton/shared/lib/apps/helper'

const DocumentTitleDropdown = ({
  controller,
  action,
}: {
  controller: DocControllerInterface | null
  action?: DocumentAction['mode']
}) => {
  const application = useApplication()

  const [title, setTitle] = useState<string | undefined>()
  const [isDuplicating, setIsDuplicating] = useState<boolean>(false)
  const [historyModal, showHistoryModal] = useHistoryViewerModal()

  const [isRenaming, setIsRenaming] = useState(false)
  const [renameInputValue, setRenameInputValue] = useState(title)
  useEffect(() => {
    setRenameInputValue(title)
  }, [title])

  useAppTitle(title)

  const confirmRename = useCallback(() => {
    if (!controller) {
      throw new Error('Primary controller not found')
    }
    const oldName = title
    const newName = renameInputValue?.trim()
    if (newName) {
      setIsRenaming(false)
      if (oldName !== newName) {
        void controller.renameDocument(newName).then((result) => {
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
  }, [application.eventBus, controller, renameInputValue, title])

  const onDuplicate = useCallback(
    (event: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
      if (!controller) {
        throw new Error('Primary controller not found')
      }

      event.preventDefault()
      event.stopPropagation()

      setIsDuplicating(true)

      void controller.duplicateDocument().then(() => {
        setIsDuplicating(false)
      })
    },
    [controller],
  )

  useEffect(() => {
    return application.eventBus.addEventCallback<DocControllerEventPayloads['DidLoadDocumentTitle']>((payload) => {
      setTitle(payload.title)
    }, DocControllerEvent.DidLoadDocumentTitle)
  }, [application.eventBus])

  const onNewDocument = useCallback(() => {
    void controller?.createNewDocument()
  }, [controller])

  useEffect(() => {
    if (!controller) {
      return
    }

    setTitle(controller.getSureDocument().name)

    if (action === 'history') {
      showHistoryModal({
        versionHistory: controller.getVersionHistory(),
      })
    }
  }, [controller, action, showHistoryModal])

  const { anchorRef, isOpen, toggle, close } = usePopperAnchor<HTMLButtonElement>()

  const focusInputOnMount = useCallback((input: HTMLInputElement | null) => {
    if (input) {
      input.focus()
    }
  }, [])

  if (isRenaming) {
    return (
      <div className="flex items-center px-1.5">
        <img className="pointer-events-none mr-0.5 h-5 w-5" src={documentIcon} alt="" aria-hidden="true" />
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

  return (
    <>
      <DropdownButton
        ref={anchorRef}
        isOpen={isOpen}
        onClick={toggle}
        hasCaret
        shape="ghost"
        size="small"
        className="max-w-custom whitespace-nowrap px-1.5 py-1.5"
        style={{
          '--max-w-custom': '35vw',
        }}
        data-testid="document-name-dropdown"
      >
        <img className="pointer-events-none mr-2 h-5 w-5" src={documentIcon} alt="" aria-hidden="true" />
        <span className="text-ellipsis text-sm">{title}</span>
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
          {controller?.role.canEdit() && (
            <DropdownMenuButton
              className="flex items-center text-left"
              onClick={() => setIsRenaming((renaming) => !renaming)}
              data-testid="dropdown-rename"
            >
              <Icon name="pencil" className="color-weak mr-2" />
              {c('Action').t`Rename document`}
            </DropdownMenuButton>
          )}

          <DropdownMenuButton
            className="flex items-center text-left"
            onClick={onNewDocument}
            data-testid="dropdown-new-document"
          >
            <Icon name="file" className="color-weak mr-2" />
            {c('Action').t`New document`}
          </DropdownMenuButton>

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

          <DropdownMenuButton
            className="flex items-center text-left"
            onClick={() => {
              if (!controller) {
                return
              }
              showHistoryModal({
                versionHistory: controller.getVersionHistory(),
              })
            }}
            data-testid="dropdown-versioning"
          >
            <Icon name="clock-rotate-left" className="color-weak mr-2" />
            {c('Action').t`See version history`}
          </DropdownMenuButton>

          <hr className="my-1 min-h-px" />

          {controller && (
            <DropdownMenuButton
              className="flex items-center text-left"
              onClick={() => {
                void controller.printAsPDF()
              }}
            >
              <Icon name="printer" className="color-weak mr-2" />
              {c('Action').t`Print`}
            </DropdownMenuButton>
          )}

          {controller && (
            <SimpleDropdown
              as={DropdownMenuButton}
              className="flex items-center text-left"
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
                    void controller.exportAndDownload('docx')
                  }}
                >
                  {c('Action').t`Microsoft Word (.docx)`}
                </DropdownMenuButton>
                <DropdownMenuButton
                  className="flex items-center text-left"
                  onClick={() => {
                    void controller.exportAndDownload('html')
                  }}
                >
                  {c('Action').t`Web page (.html)`}
                </DropdownMenuButton>
                <DropdownMenuButton
                  className="flex items-center text-left"
                  onClick={() => {
                    void controller.exportAndDownload('txt')
                  }}
                >
                  {c('Action').t`Plain Text (.txt)`}
                </DropdownMenuButton>
                <DropdownMenuButton
                  className="flex items-center text-left"
                  onClick={() => {
                    void controller.exportAndDownload('md')
                  }}
                >
                  {c('Action').t`Markdown (.md)`}
                </DropdownMenuButton>
              </DropdownMenu>
            </SimpleDropdown>
          )}

          <hr className="my-1 min-h-px" />

          <DropdownMenuButton
            className="flex items-center text-left"
            onClick={() => {
              window.open(getStaticURL('/support'), '_blank')
            }}
          >
            <Icon name="info-circle" className="color-weak mr-2" />
            {c('Action').t`Help`}
          </DropdownMenuButton>
          <DropdownMenuButton
            className="flex items-center text-left"
            onClick={() => {
              window.open(getAppHref('/', APPS.PROTONDRIVE), '_blank')
            }}
          >
            <Icon name="brand-proton-drive" className="color-weak mr-2" />
            {c('Action').t`Open ${DRIVE_APP_NAME}`}
          </DropdownMenuButton>

          <hr className="mt-1 min-h-px" />

          <div
            className="color-weak px-4 py-2"
            style={{
              background: 'var(--primary-minor-2)',
            }}
          >
            <Icon name="lock-check" className="color-weak mr-2 align-middle" />
            <span className="align-middle">{c('Info').t`End to end encrypted.`} </span>
            <a
              data-connection-popover
              className="align-middle underline hover:underline"
              href="https://proton.me/security/end-to-end-encryption"
              target="_blank"
            >
              {c('Info').t`Learn more`}
            </a>
          </div>
        </DropdownMenu>
      </Dropdown>

      {historyModal}
    </>
  )
}

export default DocumentTitleDropdown
