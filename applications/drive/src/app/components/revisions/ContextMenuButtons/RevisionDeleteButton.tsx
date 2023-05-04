import { c } from 'ttag';

import { DriveFileRevision } from '@proton/shared/lib/interfaces/drive/file';

import { ContextMenuButton } from '../../sections/ContextMenu';
import { RevisionsProviderState } from '../RevisionsProvider';

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
