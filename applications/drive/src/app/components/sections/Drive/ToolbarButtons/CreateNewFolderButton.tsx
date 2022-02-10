import { c } from 'ttag';

import { Icon, ToolbarButton } from '@proton/components';

import useOpenModal from '../../../useOpenModal';

const CreateNewFolderButton = () => {
    const { openCreateFolder } = useOpenModal();

    return (
        <ToolbarButton
            icon={<Icon name="folder-plus" />}
            title={c('Action').t`Create new folder`}
            onClick={openCreateFolder}
            data-testid="toolbar-new-folder"
        />
    );
};

export default CreateNewFolderButton;
