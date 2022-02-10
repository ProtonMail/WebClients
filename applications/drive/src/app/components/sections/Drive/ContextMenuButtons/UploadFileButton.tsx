import { c } from 'ttag';

import { ContextMenuButton } from '../../ContextMenu';

interface Props {
    close: () => void;
    onClick: () => void;
}

const UploadFileButton = ({ close, onClick }: Props) => {
    return (
        <ContextMenuButton
            testId="toolbar-upload-file"
            icon="file-arrow-up"
            name={c('Action').t`Upload file`}
            action={onClick}
            close={close}
        />
    );
};

export default UploadFileButton;
