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
export const UploadFileButton = ({ onClick }: Props) => {
    return (
        <>
            <DropdownMenuButton
                className="text-left flex items-center"
                onClick={onClick}
                data-testid="dropdown-upload-file"
            >
                <Icon className="mr-2" name="file-arrow-in-up" />
                <span>{c('Action').t`Upload file`}</span>
            </DropdownMenuButton>
        </>
    );
};
