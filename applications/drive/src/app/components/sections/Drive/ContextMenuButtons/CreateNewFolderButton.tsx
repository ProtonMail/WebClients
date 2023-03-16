import { c } from 'ttag';

import { ContextMenuButton } from '../../ContextMenu';

interface Props {
    action: () => void;
    close: () => void;
}

const CreateNewFolderButton = ({ close, action }: Props) => {
    return (
        <ContextMenuButton
            testId="toolbar-new-folder"
            icon="folder-plus"
            name={c('Action').t`Create new folder`}
            action={action}
            close={close}
        />
    );
};

export default CreateNewFolderButton;
