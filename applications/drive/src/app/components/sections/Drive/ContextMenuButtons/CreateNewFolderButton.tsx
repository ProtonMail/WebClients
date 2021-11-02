import { c } from 'ttag';

import { ContextMenuButton } from '../../ContextMenu';
import useToolbarActions from '../../../../hooks/drive/useActions';

interface Props {
    close: () => void;
}

const CreateNewFolderButton = ({ close }: Props) => {
    const { openCreateFolder } = useToolbarActions();

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
