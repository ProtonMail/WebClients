import { c } from 'ttag';

import { Icon, ToolbarButton } from '@proton/components';

import { useCreateFileModal } from '../../../components/modals/CreateFileModal';

export const CreateNewFileButton = () => {
    const [createFileModal, showCreateFileModal] = useCreateFileModal();

    return (
        <>
            <ToolbarButton
                icon={<Icon name="file" alt={c('Action').t`Create new text file`} />}
                title={c('Action').t`Create new text file`}
                onClick={() => showCreateFileModal({})}
                data-testid="toolbar-create-file"
            />
            {createFileModal}
        </>
    );
};
