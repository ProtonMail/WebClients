import { c } from 'ttag';

import type { Revision } from '@proton/drive';

import { ContextMenuButton } from '../../../../components/sections/ContextMenu';
import type { RevisionsProviderState } from '../../useRevisionsModalState';

interface Props {
    revision: Revision;
    restoreRevision: RevisionsProviderState['deleteRevision'];
    close: () => void;
}

export const RevisionRestoreButton = ({ revision, restoreRevision, close }: Props) => {
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
