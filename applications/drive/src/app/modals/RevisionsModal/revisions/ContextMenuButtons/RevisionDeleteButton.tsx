import { c } from 'ttag';

import type { Revision } from '@proton/drive';
import { IcTrashCross } from '@proton/icons/icons/IcTrashCross';

import { ContextMenuButton } from '../../../../statelessComponents/ContextMenu';
import type { RevisionsProviderState } from '../../useRevisionsModalState';

interface Props {
    revision: Revision;
    deleteRevision: RevisionsProviderState['deleteRevision'];
    close: () => void;
}

export const RevisionDeleteButton = ({ revision, deleteRevision, close }: Props) => {
    const title = c('Action').t`Delete version`;
    return (
        <ContextMenuButton
            name={title}
            icon={<IcTrashCross />}
            testId="context-menu-revision-delete"
            action={() => deleteRevision(revision)}
            close={close}
        />
    );
};
