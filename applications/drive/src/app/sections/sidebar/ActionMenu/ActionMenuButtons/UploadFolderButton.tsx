import { c } from 'ttag';

import { DropdownMenuButton } from '@proton/components';
import { IcFolderArrowUp } from '@proton/icons/icons/IcFolderArrowUp';

interface Props {
    onClick: () => void;
}

/**
 * TODO: Migrate to use reusable upload components
 * See: applications/drive/src/app/statelessComponents/UploadCreateDropdown/UploadCreateDropdown.tsx
 * and applications/drive/src/app/legacy/hooks/drive/useUploadInput.ts
 */
export const UploadFolderButton = ({ onClick }: Props) => {
    return (
        <>
            <DropdownMenuButton
                className="text-left flex items-center"
                onClick={onClick}
                data-testid="dropdown-upload-folder"
            >
                <IcFolderArrowUp className="mr-2" />
                <span>{c('Action').t`Upload folder`}</span>
            </DropdownMenuButton>
        </>
    );
};
