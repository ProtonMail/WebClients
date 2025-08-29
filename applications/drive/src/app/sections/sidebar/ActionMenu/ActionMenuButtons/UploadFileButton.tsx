import { c } from 'ttag';

import { DropdownMenuButton, Icon } from '@proton/components';

interface Props {
    onClick: () => void;
}

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
