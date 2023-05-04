import { c } from 'ttag';

import { ContextMenuButton } from '../../sections/ContextMenu';

interface Props {
    close: () => void;
}

const RevisionRestoreButton = ({ close }: Props) => {
    return (
        <ContextMenuButton
            name={c('Action').t`Restore version`}
            icon="arrow-rotate-right"
            testId="context-menu-revision-restore"
            action={() => {}}
            close={close}
        />
    );
};

export default RevisionRestoreButton;
