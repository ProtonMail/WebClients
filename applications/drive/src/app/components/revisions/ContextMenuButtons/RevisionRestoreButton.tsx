import { c } from 'ttag';

import type { DriveFileRevision } from '../../../store';
import { ContextMenuButton } from '../../sections/ContextMenu';
import type { RevisionsProviderState } from '../RevisionsProvider';

interface Props {
    revision: DriveFileRevision;
    restoreRevision: RevisionsProviderState['deleteRevision'];
    close: () => void;
}

const RevisionRestoreButton = ({ revision, restoreRevision, close }: Props) => {
    return (
        <ContextMenuButton
            name={c('Action').t`Restore version`}
            icon="arrow-rotate-right"
            testId="context-menu-revision-restore"
            action={() => restoreRevision(new AbortController().signal, revision)}
            close={close}
        />
    );
};

export default RevisionRestoreButton;
