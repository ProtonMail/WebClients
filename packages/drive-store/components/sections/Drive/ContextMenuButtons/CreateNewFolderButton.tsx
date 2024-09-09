import { c } from 'ttag';

import { ContextMenuButton } from '../../ContextMenu';

interface Props {
    action: () => void;
    close: () => void;
}

const CreateNewFolderButton = ({ close, action }: Props) => {
    return (
        <ContextMenuButton
            testId="context-menu-new-folder"
            icon="folder-plus"
            name={c('Action').t`New folder`}
            action={action}
            close={close}
        />
    );
};

export default CreateNewFolderButton;
