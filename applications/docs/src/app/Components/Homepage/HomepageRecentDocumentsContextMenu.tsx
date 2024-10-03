import { c } from 'ttag'

import { Button } from '@proton/atoms'
import {
  Dropdown,
  DropdownMenu,
  DropdownMenuButton,
  DropdownSizeUnit,
  Icon,
  MimeIcon,
  usePopperAnchor,
} from '@proton/components'

export type HomepageRecentDocumentsContextMenuProps = {
  onOpenDocument: (event: React.MouseEvent) => void
  onOpenFolder: (event: React.MouseEvent) => void
  isOpenFolderVisible: boolean
}

export const HomepageRecentDocumentsContextMenu = ({
  onOpenDocument,
  onOpenFolder,
  isOpenFolderVisible,
}: HomepageRecentDocumentsContextMenuProps) => {
  const { anchorRef, isOpen, close, open } = usePopperAnchor<HTMLButtonElement>()
  return (
    <>
      <Button
        onClick={(e) => {
          e.stopPropagation()
          open()
        }}
        ref={anchorRef}
        shape="ghost"
        className="ml-auto shrink-0 px-2"
        aria-label={c('Action').t`Context menu`}
      >
        <Icon name="three-dots-vertical" />
      </Button>
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
        <DropdownMenu>
          <DropdownMenuButton
            className="flex items-center text-left"
            onClick={onOpenDocument}
            data-testid="dropdown-open"
          >
            <MimeIcon name="proton-doc" className="color-weak mr-2" />
            {c('Action').t`Open`}
          </DropdownMenuButton>
        </DropdownMenu>
        {isOpenFolderVisible && (
          <DropdownMenu>
            <DropdownMenuButton
              className="flex items-center text-left"
              onClick={onOpenFolder}
              data-testid="dropdown-open"
            >
              <Icon name="folder-open" className="color-weak mr-2" />
              {c('Action').t`Open folder`}
            </DropdownMenuButton>
          </DropdownMenu>
        )}
      </Dropdown>
    </>
  )
}
