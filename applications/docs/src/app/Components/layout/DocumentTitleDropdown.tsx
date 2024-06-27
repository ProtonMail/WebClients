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
import { DocControllerInterface, PostApplicationError } from '@proton/docs-core'
import { useHistoryViewerModal } from '../HistoryViewer'
import { c } from 'ttag'
import { useApplication } from '../../Containers/ApplicationProvider'
import { CircleLoader } from '@proton/atoms/CircleLoader'
import documentIcon from '@proton/styles/assets/img/drive/file-document-proton.svg'
import { DocumentAction } from '@proton/drive-store'

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

  useAppTitle(title)

  const onRename = useCallback(() => {
    if (!controller) {
      throw new Error('Primary controller not found')
    }
    const oldName = controller.getSureDocument().name
    const newName = window.prompt('Enter new document name')
    if (newName) {
      void controller.renameDocument(newName).then((result) => {
        if (result.isFailed()) {
          PostApplicationError(application.eventBus, { translatedError: result.getTranslatedError() })
          setTitle(oldName)
        }
      })
      setTitle(newName)
    }
  }, [application.eventBus, controller])

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

    if (action === 'download') {
      void controller.initialize().then(() => {
        void controller.exportAndDownload('docx')
      })
    }

    return controller.addChangeObserver((doc) => {
      setTitle(doc.name)
    })
  }, [controller, action, showHistoryModal])

  const { anchorRef, isOpen, toggle, close } = usePopperAnchor<HTMLButtonElement>()

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
      >
        <DropdownMenu className="text-sm">
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
            {c('Action').t`History`}
          </DropdownMenuButton>

          {controller?.role.isAdmin() && (
            <DropdownMenuButton
              className="flex items-center text-left"
              onClick={onRename}
              data-testid="dropdown-rename"
            >
              <Icon name="pencil" className="color-weak mr-2" />
              {c('Action').t`Rename`}
            </DropdownMenuButton>
          )}

          <DropdownMenuButton
            disabled={isDuplicating}
            className="flex items-center text-left"
            onClick={onDuplicate}
            data-testid="dropdown-duplicate"
          >
            <Icon name="squares" className="color-weak mr-2" />
            {c('Action').t`Duplicate`}
            {isDuplicating && <CircleLoader size="small" className="ml-auto" />}
          </DropdownMenuButton>

          <DropdownMenuButton
            className="flex items-center text-left"
            onClick={onNewDocument}
            data-testid="dropdown-new-document"
          >
            <Icon name="folder-plus" className="color-weak mr-2" />
            {c('Action').t`New document`}
          </DropdownMenuButton>

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
        </DropdownMenu>
      </Dropdown>

      {historyModal}
    </>
  )
}

export default DocumentTitleDropdown
