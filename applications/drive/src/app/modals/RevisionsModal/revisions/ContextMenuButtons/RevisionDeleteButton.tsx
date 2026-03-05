import { c } from 'ttag';

import type { Revision } from '@proton/drive';

import { ContextMenuButton } from '../../../../components/sections/ContextMenu';
import type { RevisionsProviderState } from '../../useRevisionsModalState';

interface Props {
    revision: Revision;
    deleteRevision: RevisionsProviderState['deleteRevision'];
    close: () => void;
}

export const RevisionDeleteButton = ({ revision, deleteRevision, close }: Props) => {
    return (
        <ContextMenuButton
            name={c('Action').t`Delete version`}
            icon="trash-cross"
            testId="context-menu-revision-delete"
            action={() => deleteRevision(revision)}
            close={close}
        />
    );
};
