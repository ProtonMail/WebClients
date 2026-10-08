import { c } from 'ttag';

import { getDrive } from '@proton/drive';
import { IcClockRotateLeft } from '@proton/icons/icons/IcClockRotateLeft';

import type { useRevisionsModal } from '../../../modals/RevisionsModal';
import { ContextMenuButton } from '../../../statelessComponents/ContextMenu';

interface Props {
    nodeUid: string;
    rootShareId: string;
    showRevisionsModal: ReturnType<typeof useRevisionsModal>['showRevisionsModal'];
    close: () => void;
}

export const RevisionsContextButton = ({ nodeUid, showRevisionsModal, close }: Props) => {
    const title = c('Action').t`See version history`;

    return (
        <ContextMenuButton
            name={title}
            icon={<IcClockRotateLeft />}
            testId="context-menu-revisions"
            action={() => {
                // Revision is not supported on photos so we force getDrive
                showRevisionsModal({ nodeUid, drive: getDrive() });
            }}
            close={close}
        />
    );
};
