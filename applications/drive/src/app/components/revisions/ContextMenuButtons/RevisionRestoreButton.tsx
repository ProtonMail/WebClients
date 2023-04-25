import { c } from 'ttag';

import { DriveFileRevision } from '@proton/shared/lib/interfaces/drive/file';

import { ContextMenuButton } from '../../sections/ContextMenu';
import { RevisionsProviderState } from '../RevisionsProvider';

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
