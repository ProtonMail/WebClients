import { c } from 'ttag';

import { ContextMenuButton } from '../../../components/sections/ContextMenu';

interface Props {
    close: () => void;
    onClick: () => void;
}

export const UploadFileButton = ({ close, onClick }: Props) => {
    return (
        <ContextMenuButton
            testId="context-menu-upload-file"
            icon="file-arrow-in-up"
            name={c('Action').t`Upload file`}
            action={onClick}
            close={close}
        />
    );
};
