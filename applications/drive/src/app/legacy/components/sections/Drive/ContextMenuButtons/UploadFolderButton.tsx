import { c } from 'ttag';

import { IcFolderArrowUp } from '@proton/icons/icons/IcFolderArrowUp';

import { ContextMenuButton } from '../../../../../statelessComponents/ContextMenu';

interface Props {
    close: () => void;
    onClick: () => void;
}

const UploadFolderButton = ({ close, onClick }: Props) => {
    const title = c('Action').t`Upload folder`;
    return (
        <ContextMenuButton
            testId="context-menu-upload-folder"
            icon={<IcFolderArrowUp />}
            name={title}
            action={onClick}
            close={close}
        />
    );
};

export default UploadFolderButton;
