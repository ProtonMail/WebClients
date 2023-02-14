import { c } from 'ttag';

import { DropdownMenuButton, Icon } from '@proton/components';

interface Props {
    onClick: () => void;
}

const UploadFolderButton = ({ onClick }: Props) => {
    return (
        <>
            <DropdownMenuButton
                className="text-left flex flex-align-items-center"
                onClick={onClick}
                data-testid="dropdown-upload-folder"
            >
                <Icon className="mr0-5" name="folder-arrow-up" />
                {c('Action').t`Upload folder`}
            </DropdownMenuButton>
        </>
    );
};

export default UploadFolderButton;
