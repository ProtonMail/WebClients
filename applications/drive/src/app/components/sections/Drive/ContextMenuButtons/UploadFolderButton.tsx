import { c } from 'ttag';

import { ContextMenuButton } from '../../ContextMenu';

interface Props {
    close: () => void;
    onClick: () => void;
}

const UploadFolderButton = ({ close, onClick }: Props) => {
    return (
        <ContextMenuButton
            testId="context-menu-upload-folder"
            icon="folder-arrow-up"
            name={c('Action').t`Upload folder`}
            action={onClick}
            close={close}
        />
    );
};

export default UploadFolderButton;
