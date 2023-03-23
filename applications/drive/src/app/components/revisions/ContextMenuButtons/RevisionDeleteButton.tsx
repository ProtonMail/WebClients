import { c } from 'ttag';

import { ContextMenuButton } from '../../sections/ContextMenu';

interface Props {
    close: () => void;
}

const RevisionDeleteButton = ({ close }: Props) => {
    return (
        <ContextMenuButton
            name={c('Action').t`Delete version`}
            icon="trash-cross"
            testId="context-menu-revision-delete"
            action={() => {}}
            close={close}
        />
    );
};

export default RevisionDeleteButton;
