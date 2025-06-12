import { c } from 'ttag';

import type { Revision } from '@proton/drive';

import { ContextMenuButton } from '../../sections/ContextMenu';
import type { RevisionsProviderState } from '../RevisionsProvider';

interface Props {
    revision: Revision;
    restoreRevision: RevisionsProviderState['deleteRevision'];
    close: () => void;
}

const RevisionRestoreButton = ({ revision, restoreRevision, close }: Props) => {
    return (
        <ContextMenuButton
            name={c('Action').t`Restore version`}
            icon="arrow-rotate-right"
            testId="context-menu-revision-restore"
            action={() => restoreRevision(revision)}
            close={close}
        />
    );
};

export default RevisionRestoreButton;
