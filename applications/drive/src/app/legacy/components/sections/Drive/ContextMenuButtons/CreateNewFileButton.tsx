import { c } from 'ttag';

import { ContextMenuButton } from '../../ContextMenu';

interface Props {
    action: () => void;
    close: () => void;
}

const CreateNewFileButton = ({ close, action }: Props) => {
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

export default CreateNewFileButton;
