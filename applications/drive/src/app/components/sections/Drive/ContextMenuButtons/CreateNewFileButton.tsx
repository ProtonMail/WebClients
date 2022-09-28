import { c } from 'ttag';

import useOpenModal from '../../../useOpenModal';
import { ContextMenuButton } from '../../ContextMenu';

interface Props {
    close: () => void;
}

const CreateNewFileButton = ({ close }: Props) => {
    const { openCreateFile } = useOpenModal();

    return (
        <ContextMenuButton
            testId="toolbar-new-file"
            icon="file"
            name={c('Action').t`Create new text file`}
            action={openCreateFile}
            close={close}
        />
    );
};

export default CreateNewFileButton;
