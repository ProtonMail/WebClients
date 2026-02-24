import { c } from 'ttag';

import { ToolbarButton } from '@proton/components';
import { IcFile } from '@proton/icons/icons/IcFile';

import { useCreateFileModal } from '../../../../modals/CreateFileModal';

const CreateNewFileButton = () => {
    const { createFileModal, showCreateFileModal } = useCreateFileModal();

    return (
        <>
            <ToolbarButton
                icon={<IcFile alt={c('Action').t`Create new text file`} />}
                title={c('Action').t`Create new text file`}
                onClick={() => showCreateFileModal({})}
                data-testid="toolbar-create-file"
            />
            {createFileModal}
        </>
    );
};

export default CreateNewFileButton;
