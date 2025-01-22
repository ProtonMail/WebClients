import { c } from 'ttag';

import { Icon, ToolbarButton } from '@proton/components';

import type { DriveFolder } from '../../../../hooks/drive/useActiveShare';
import type { useActions } from '../../../../store';
import { useCreateFolderModal } from '../../../modals/CreateFolderModal';

export interface CreateNewFolderButtonProps {
    activeFolder: DriveFolder;
    createFolder: ReturnType<typeof useActions>['createFolder'];
}

const CreateNewFolderButton = ({ activeFolder, createFolder }: CreateNewFolderButtonProps) => {
    const [createFolderModal, showCreateFolderModal] = useCreateFolderModal();

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
