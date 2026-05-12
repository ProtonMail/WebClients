import { c } from 'ttag';

import { Dropdown, DropdownMenu, DropdownMenuButton, MimeIcon } from '@proton/components';
import { IcFileArrowInUp } from '@proton/icons/icons/IcFileArrowInUp';
import { IcFolderArrowUp } from '@proton/icons/icons/IcFolderArrowUp';
import { IcFolderPlus } from '@proton/icons/icons/IcFolderPlus';

interface UploadCreateDropdownProps {
    onUploadFile?: () => void;
    onUploadFolder?: () => void;
    onCreateFolder?: () => void;
    onCreateDocument?: () => void;
    onCreateSpreadsheet?: () => void;
    anchorRef: React.RefObject<HTMLElement>;
    isOpen: boolean;
    onClose: () => void;
}

export function UploadCreateDropdown({
    onUploadFile,
    onUploadFolder,
    onCreateFolder,
    onCreateDocument,
    onCreateSpreadsheet,
    anchorRef,
    isOpen,
    onClose,
}: UploadCreateDropdownProps) {
    const hasUploadActions = onUploadFile || onUploadFolder;
    const hasCreateActions = onCreateFolder || onCreateDocument || onCreateSpreadsheet;
    const showDivider = hasUploadActions && hasCreateActions;

    return (
        <Dropdown anchorRef={anchorRef} isOpen={isOpen} onClose={onClose} data-testid="upload-create-dropdown">
            <DropdownMenu>
                {onUploadFile && (
                    <DropdownMenuButton className="flex items-center gap-2" onClick={onUploadFile}>
                        <IcFileArrowInUp />
                        {c('Action').t`Upload file`}
                    </DropdownMenuButton>
                )}
                {onUploadFolder && (
                    <DropdownMenuButton className="flex items-center gap-2" onClick={onUploadFolder}>
                        <IcFolderArrowUp />
                        {c('Action').t`Upload folder`}
                    </DropdownMenuButton>
                )}
                {showDivider && <hr className="my-2" />}
                {onCreateFolder && (
                    <DropdownMenuButton className="flex items-center gap-2" onClick={onCreateFolder}>
                        <IcFolderPlus />
                        {c('Action').t`New folder`}
                    </DropdownMenuButton>
                )}
                {onCreateDocument && (
                    <DropdownMenuButton className="flex items-center gap-2" onClick={onCreateDocument}>
                        <MimeIcon name="proton-doc" />
                        {c('Action').t`New document`}
                    </DropdownMenuButton>
                )}
                {onCreateSpreadsheet && (
                    <DropdownMenuButton className="flex items-center gap-2" onClick={onCreateSpreadsheet}>
                        <MimeIcon name="proton-sheet" />
                        {c('Action').t`New spreadsheet`}
                    </DropdownMenuButton>
                )}
            </DropdownMenu>
        </Dropdown>
    );
}
