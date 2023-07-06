import { c } from 'ttag';

import { Icon, ToolbarButton } from '@proton/components';

import { useCreateFolderModal } from '../../../modals/CreateFolderModal';

const CreateNewFolderButton = () => {
    const [createFolderModal, showCreateFolderModal] = useCreateFolderModal();

    return (
        <>
            <ToolbarButton
                icon={<Icon name="folder-plus" alt={c('Action').t`Create new folder`} />}
                title={c('Action').t`Create new folder`}
                onClick={() => showCreateFolderModal()}
                data-testid="toolbar-new-folder"
            />
            {createFolderModal}
        </>
    );
};

export default CreateNewFolderButton;
