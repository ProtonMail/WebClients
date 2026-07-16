import { c } from 'ttag';

import type { Revision } from '@proton/drive';
import { IcArrowRotateRight } from '@proton/icons/icons/IcArrowRotateRight';

import { ContextMenuButton } from '../../../../statelessComponents/ContextMenu';
import type { RevisionsProviderState } from '../../useRevisionsModalState';

interface Props {
    revision: Revision;
    restoreRevision: RevisionsProviderState['deleteRevision'];
    close: () => void;
}

export const RevisionRestoreButton = ({ revision, restoreRevision, close }: Props) => {
    const title = c('Action').t`Restore version`;
    return (
        <ContextMenuButton
            name={title}
            icon={<IcArrowRotateRight />}
            testId="context-menu-revision-restore"
            action={() => restoreRevision(revision)}
            close={close}
        />
    );
};
