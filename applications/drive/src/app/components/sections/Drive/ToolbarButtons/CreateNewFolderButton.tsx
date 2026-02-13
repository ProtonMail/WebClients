import { c } from 'ttag';

import { ToolbarButton } from '@proton/components';
import { generateNodeUid } from '@proton/drive/index';
import { IcFolderPlus } from '@proton/icons/icons/IcFolderPlus';

import type { DriveFolder } from '../../../../hooks/drive/useActiveShare';
import { useCreateFolderModal } from '../../../../modals/CreateFolderModal';

export interface CreateNewFolderButtonProps {
    activeFolder: DriveFolder;
}

const CreateNewFolderButton = ({ activeFolder }: CreateNewFolderButtonProps) => {
    const { createFolderModal, showCreateFolderModal } = useCreateFolderModal();
    const activeFolderUid = generateNodeUid(activeFolder.volumeId, activeFolder.linkId);

    return (
        <>
            <ToolbarButton
                icon={<IcFolderPlus alt={c('Action').t`Create new folder`} />}
                title={c('Action').t`Create new folder`}
                onClick={() => showCreateFolderModal({ parentFolderUid: activeFolderUid })}
                data-testid="toolbar-new-folder"
            />
            {createFolderModal}
        </>
    );
};

export default CreateNewFolderButton;
