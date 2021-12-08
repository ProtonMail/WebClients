import { c } from 'ttag';

import useOpenModal from '../../../useOpenModal';
import { ContextMenuButton } from '../../ContextMenu';

interface Props {
    close: () => void;
}

const CreateNewFolderButton = ({ close }: Props) => {
    const { openCreateFolder } = useOpenModal();

    return (
        <ContextMenuButton
            testId="toolbar-new-folder"
            icon="folder-plus"
            name={c('Action').t`Create new folder`}
            action={openCreateFolder}
            close={close}
        />
    );
};

export default CreateNewFolderButton;
