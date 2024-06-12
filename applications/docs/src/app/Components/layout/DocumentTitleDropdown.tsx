import {
  Dropdown,
  DropdownButton,
  DropdownMenu,
  DropdownMenuButton,
  DropdownSizeUnit,
  Icon,
  useAppTitle,
  usePopperAnchor,
} from '@proton/components'
import { useCallback, useEffect, useState } from 'react'
import { DocControllerInterface } from '@proton/docs-core'
import { useHistoryViewerModal } from '../HistoryViewer'
import { c } from 'ttag'

const DocumentTitleDropdown = ({ controller }: { controller: DocControllerInterface | null }) => {
  const [title, setTitle] = useState<string>('Loading document title...')
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
          alert(result.getError())
          setTitle(oldName)
        }
      })
      setTitle(newName)
    }
  }, [controller])

  const onDuplicate = useCallback(() => {
    void controller?.duplicateDocument()
  }, [controller])

  const onNewDocument = useCallback(() => {
    void controller?.createNewDocument()
  }, [controller])

  useEffect(() => {
    if (!controller) {
      return
    }

    setTitle(controller.getSureDocument().name)

    return controller.addChangeObserver((doc) => {
      setTitle(doc.name)
    })
  }, [controller])

  const { anchorRef, isOpen, toggle, close } = usePopperAnchor<HTMLButtonElement>()

  return (
    <>
      <DropdownButton
        ref={anchorRef}
        isOpen={isOpen}
        onClick={toggle}
        hasCaret
        shape="ghost"
        size="small"
        className="max-w-custom whitespace-nowrap"
        style={{
          '--max-w-custom': '35vw',
        }}
      >
        <span className="text-ellipsis">{title}</span>
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
          >
            <Icon name="clock-rotate-left" className="color-weak mr-2" />
            {c('Action').t`History`}
          </DropdownMenuButton>

          <DropdownMenuButton className="flex items-center text-left" onClick={onRename}>
            <Icon name="pencil" className="color-weak mr-2" />
            {c('Action').t`Rename document`}
          </DropdownMenuButton>

          <DropdownMenuButton className="flex items-center text-left" onClick={onDuplicate}>
            <Icon name="squares" className="color-weak mr-2" />
            {c('Action').t`Duplicate`}
          </DropdownMenuButton>

          <DropdownMenuButton className="flex items-center text-left" onClick={onNewDocument}>
            <Icon name="folder-plus" className="color-weak mr-2" />
            {c('Action').t`New document`}
          </DropdownMenuButton>

          {/* <DropdownMenuButton
            className="flex items-center text-left"
            // onClick={startDownload}
            // @TODO DRVDOC-316
          >
            <Icon name="arrow-down-to-square" className="color-weak mr-2" />
            Download
          </DropdownMenuButton> */}
        </DropdownMenu>
      </Dropdown>
      {historyModal}
    </>
  )
}

export default DocumentTitleDropdown
