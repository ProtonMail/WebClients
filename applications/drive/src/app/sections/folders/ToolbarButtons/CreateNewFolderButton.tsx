import { c } from 'ttag';

import { Icon, ToolbarButton } from '@proton/components';

import { useCreateFolderModal } from '../../../components/modals/CreateFolderModal';
import { useActions } from '../../../store';

export interface CreateNewFolderButtonProps {
    activeFolder: {
        shareId: string;
        linkId: string;
        volumeId: string;
    };
}

export const CreateNewFolderButton = ({ activeFolder }: CreateNewFolderButtonProps) => {
    const [createFolderModal, showCreateFolderModal] = useCreateFolderModal();
    const { createFolder } = useActions();

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
