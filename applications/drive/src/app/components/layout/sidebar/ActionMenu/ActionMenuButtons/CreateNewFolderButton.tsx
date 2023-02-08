import { c } from 'ttag';

import { DropdownMenuButton, Icon } from '@proton/components';

import useOpenModal from '../../../../useOpenModal';

const CreateNewFolderButton = () => {
    const { openCreateFolder } = useOpenModal();

    return (
        <DropdownMenuButton
            className="text-left flex flex-align-items-center"
            onClick={openCreateFolder}
            data-testid="dropdown-new-folder"
        >
            <Icon className="mr0-5" name="folder-plus" />
            {c('Action').t`Create new folder`}
        </DropdownMenuButton>
    );
};

export default CreateNewFolderButton;
