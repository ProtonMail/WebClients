import { c } from 'ttag';

import type { DriveFileRevision } from '../../../store';
import { ContextMenuButton } from '../../sections/ContextMenu';
import type { RevisionsProviderState } from '../RevisionsProvider';

interface Props {
    revision: DriveFileRevision;
    openRevisionDetails: RevisionsProviderState['openRevisionDetails'];

    close: () => void;
}

const RevisionDetailsButton = ({ revision, openRevisionDetails, close }: Props) => {
    return (
        <ContextMenuButton
            name={c('Action').t`Details`}
            icon="info-circle"
            testId="context-menu-details"
            action={() => openRevisionDetails(revision)}
            close={close}
        />
    );
};

export default RevisionDetailsButton;
