import { c } from 'ttag';

import { DropdownMenuButton, Icon } from '@proton/components';

interface Props {
    onClick: () => void;
}

/**
 * TODO: Migrate to use reusable create folder component
 * See: applications/drive/src/app/statelessComponents/UploadCreateDropdown/UploadCreateDropdown.tsx
 */
export const CreateNewFolderButton = ({ onClick }: Props) => {
    return (
        <DropdownMenuButton className="text-left flex items-center" onClick={onClick} data-testid="dropdown-new-folder">
            <Icon className="mr-2" name="folder-plus" />
            <span>{
                // translator: Action button in sidebar dropdown to create a new folder
                c('Action').t`New folder`
            }</span>
        </DropdownMenuButton>
    );
};
