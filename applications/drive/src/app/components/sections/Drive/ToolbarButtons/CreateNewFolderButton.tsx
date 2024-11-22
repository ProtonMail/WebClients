import { c } from 'ttag';

import { Icon, ToolbarButton } from '@proton/components';

import { useActiveShare } from '../../../../hooks/drive/useActiveShare';
import { useActions } from '../../../../store';
import { useCreateFolderModal } from '../../../modals/CreateFolderModal';

const CreateNewFolderButton = () => {
    const [createFolderModal, showCreateFolderModal] = useCreateFolderModal();
    const { createFolder } = useActions();
    const { activeFolder } = useActiveShare();

    return (
        <>
            <ToolbarButton
                icon={<Icon name="folder-plus" alt={c('Action').t`Create new folder`} />}
                title={c('Action').t`Create new folder`}
                onClick={() => showCreateFolderModal({ folder: activeFolder, createFolder })}
                data-testid="toolbar-new-folder"
            />
            {createFolderModal}
        </>
    );
};

export default CreateNewFolderButton;
