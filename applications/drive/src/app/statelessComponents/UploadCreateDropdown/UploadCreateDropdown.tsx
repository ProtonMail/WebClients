import { c } from 'ttag';

import { Dropdown, DropdownMenu, DropdownMenuButton, MimeIcon } from '@proton/components';
import Icon from '@proton/components/components/icon/Icon';

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
                        <Icon name="file-arrow-in-up" />
                        {c('Action').t`Upload file`}
                    </DropdownMenuButton>
                )}
                {onUploadFolder && (
                    <DropdownMenuButton className="flex items-center gap-2" onClick={onUploadFolder}>
                        <Icon name="folder-arrow-up" />
                        {c('Action').t`Upload folder`}
                    </DropdownMenuButton>
                )}
                {showDivider && <hr className="my-2" />}
                {onCreateFolder && (
                    <DropdownMenuButton className="flex items-center gap-2" onClick={onCreateFolder}>
                        <Icon name="folder-plus" />
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
