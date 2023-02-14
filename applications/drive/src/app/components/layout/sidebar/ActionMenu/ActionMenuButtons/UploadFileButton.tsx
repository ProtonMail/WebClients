import { c } from 'ttag';

import { DropdownMenuButton, Icon } from '@proton/components';

interface Props {
    onClick: () => void;
}

const UploadFileButton = ({ onClick }: Props) => {
    return (
        <>
            <DropdownMenuButton
                className="text-left flex flex-align-items-center"
                onClick={onClick}
                data-testid="dropdown-upload-file"
            >
                <Icon className="mr0-5" name="file-arrow-in-up" />
                {c('Action').t`Upload file`}
            </DropdownMenuButton>
        </>
    );
};

export default UploadFileButton;
