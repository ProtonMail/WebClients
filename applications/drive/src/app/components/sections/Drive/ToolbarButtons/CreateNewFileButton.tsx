import { c } from 'ttag';

import { Icon, ToolbarButton } from '@proton/components';

import useOpenModal from '../../../useOpenModal';

const CreateNewFileButton = () => {
    const { openCreateFile } = useOpenModal();

    return (
        <ToolbarButton
            icon={<Icon name="file" />}
            title={c('Action').t`Create new text file`}
            onClick={openCreateFile}
            data-testid="toolbar-create-file"
        />
    );
};

export default CreateNewFileButton;
