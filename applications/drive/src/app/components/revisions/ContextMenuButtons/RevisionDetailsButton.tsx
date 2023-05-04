import { c } from 'ttag';

import { DriveFileRevision } from '@proton/shared/lib/interfaces/drive/file';

import { ContextMenuButton } from '../../sections/ContextMenu';
import { RevisionsProviderState } from '../RevisionsProvider';

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
            testId="context-menu-revision-details"
            action={() => openRevisionDetails(revision)}
            close={close}
        />
    );
};

export default RevisionDetailsButton;
