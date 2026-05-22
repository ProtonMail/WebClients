import { c } from 'ttag';

import { getDrive } from '@proton/drive';

import type { useDrivePreviewModal } from '../../../../../modals/preview';
import ContextMenuButton from '../ContextMenuButton';

interface Props {
    shareId: string;
    linkId: string;
    nodeUid?: string;
    showPreviewModal?: ReturnType<typeof useDrivePreviewModal>['showPreviewModal'];
    close: () => void;
}

const PreviewButton = ({ shareId, nodeUid, showPreviewModal, close }: Props) => {
    return (
        <ContextMenuButton
            name={c('Action').t`Preview`}
            icon="eye"
            testId="context-menu-preview"
            action={() => {
                if (showPreviewModal && nodeUid) {
                    showPreviewModal({
                        deprecatedContextShareId: shareId,
                        nodeUid,
                        // Force drive as it's legacy
                        drive: getDrive(),
                    });
                }
            }}
            close={close}
        />
    );
};

export default PreviewButton;
