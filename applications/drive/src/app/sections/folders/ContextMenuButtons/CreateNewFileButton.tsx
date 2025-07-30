import { c } from 'ttag';

import { ContextMenuButton } from '../../../components/sections/ContextMenu';

interface Props {
    action: () => void;
    close: () => void;
}

export const CreateNewFileButton = ({ close, action }: Props) => {
    return (
        <ContextMenuButton
            testId="toolbar-new-file"
            icon="file"
            name={c('Action').t`Create new text file`}
            action={action}
            close={close}
        />
    );
};
