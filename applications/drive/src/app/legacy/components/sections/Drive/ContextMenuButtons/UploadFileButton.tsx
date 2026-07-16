import { c } from 'ttag';

import { IcFileArrowInUp } from '@proton/icons/icons/IcFileArrowInUp';

import { ContextMenuButton } from '../../../../../statelessComponents/ContextMenu';

interface Props {
    close: () => void;
    onClick: () => void;
}

const UploadFileButton = ({ close, onClick }: Props) => {
    const title = c('Action').t`Upload file`;
    return (
        <ContextMenuButton
            testId="context-menu-upload-file"
            icon={<IcFileArrowInUp />}
            name={title}
            action={onClick}
            close={close}
        />
    );
};

export default UploadFileButton;
