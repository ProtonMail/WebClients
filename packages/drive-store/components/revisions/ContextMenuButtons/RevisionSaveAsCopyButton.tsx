import { c } from 'ttag';

import { ContextMenuButton } from '../../sections/ContextMenu';

interface Props {
    close: () => void;
}

const RevisionSaveAsCopyButton = ({ close }: Props) => {
    return (
        <ContextMenuButton
            name={c('Action').t`Save version as copy`}
            icon="squares"
            testId="context-menu-revision-save-as-copy"
            action={() => {}}
            close={close}
        />
    );
};

export default RevisionSaveAsCopyButton;
