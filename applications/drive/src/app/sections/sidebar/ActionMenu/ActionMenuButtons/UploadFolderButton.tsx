import { c } from 'ttag';

import { DropdownMenuButton, Icon } from '@proton/components';

interface Props {
    onClick: () => void;
}

/**
 * TODO: Migrate to use reusable upload components
 * See: applications/drive/src/app/statelessComponents/UploadCreateDropdown/UploadCreateDropdown.tsx
 * and applications/drive/src/app/hooks/drive/useUploadInput.ts
 */
export const UploadFolderButton = ({ onClick }: Props) => {
    return (
        <>
            <DropdownMenuButton
                className="text-left flex items-center"
                onClick={onClick}
                data-testid="dropdown-upload-folder"
            >
                <Icon className="mr-2" name="folder-arrow-up" />
                <span>{c('Action').t`Upload folder`}</span>
            </DropdownMenuButton>
        </>
    );
};
