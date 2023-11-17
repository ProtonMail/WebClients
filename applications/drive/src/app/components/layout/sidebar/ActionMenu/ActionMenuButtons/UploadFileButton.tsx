import { c } from 'ttag';

import { DropdownMenuButton, Icon } from '@proton/components';

interface Props {
    onClick: () => void;
}

const UploadFileButton = ({ onClick }: Props) => {
    return (
        <>
            <DropdownMenuButton
                className="text-left flex items-center"
                onClick={onClick}
                data-testid="dropdown-upload-file"
            >
                <Icon className="mr-2" name="file-arrow-in-up" />
                {c('Action').t`Upload file`}
            </DropdownMenuButton>
        </>
    );
};

export default UploadFileButton;
