import { c } from 'ttag';

import type { DriveFileRevision } from '../../../store';
import { ContextMenuButton } from '../../sections/ContextMenu';
import type { RevisionsProviderState } from '../RevisionsProvider';

interface Props {
    revision: DriveFileRevision;
    deleteRevision: RevisionsProviderState['deleteRevision'];
    close: () => void;
}

const RevisionDeleteButton = ({ revision, deleteRevision, close }: Props) => {
    return (
        <ContextMenuButton
            name={c('Action').t`Delete version`}
            icon="trash-cross"
            testId="context-menu-revision-delete"
            action={() => deleteRevision(new AbortController().signal, revision)}
            close={close}
        />
    );
};

export default RevisionDeleteButton;
