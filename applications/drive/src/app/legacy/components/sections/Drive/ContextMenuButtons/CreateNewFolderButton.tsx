import { c } from 'ttag';

import { IcFolderPlus } from '@proton/icons/icons/IcFolderPlus';

import { ContextMenuButton } from '../../../../../statelessComponents/ContextMenu';

interface Props {
    action: () => void;
    close: () => void;
}

const CreateNewFolderButton = ({ close, action }: Props) => {
    const title = c('Action').t`New folder`;
    return (
        <ContextMenuButton
            testId="context-menu-new-folder"
            icon={<IcFolderPlus />}
            name={title}
            action={action}
            close={close}
        />
    );
};

export default CreateNewFolderButton;
