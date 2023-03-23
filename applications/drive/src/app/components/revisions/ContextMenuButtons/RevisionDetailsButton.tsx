import { c } from 'ttag';

import { ContextMenuButton } from '../../sections/ContextMenu';

interface Props {
    close: () => void;
}

const RevisionDetailsButton = ({ close }: Props) => {
    return (
        <ContextMenuButton
            name={c('Action').t`Revison details`}
            icon="info-circle"
            testId="context-menu-revision-details"
            action={() => {}}
            close={close}
        />
    );
};

export default RevisionDetailsButton;
