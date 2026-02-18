import { c } from 'ttag';

import { useFlagsDriveSDKPreview } from '../../../../flags/useFlagsDriveSDKPreview';
import type { useDrivePreviewModal } from '../../../../modals/preview';
import useOpenPreview from '../../../useOpenPreview';
import ContextMenuButton from '../ContextMenuButton';

interface Props {
    shareId: string;
    linkId: string;
    nodeUid?: string;
    showPreviewModal?: ReturnType<typeof useDrivePreviewModal>['showPreviewModal'];
    close: () => void;
}

const PreviewButton = ({ shareId, linkId, nodeUid, showPreviewModal, close }: Props) => {
    const openLegacyPreview = useOpenPreview();

    const isSDKPreviewEnabled = useFlagsDriveSDKPreview();

    return (
        <ContextMenuButton
            name={c('Action').t`Preview`}
            icon="eye"
            testId="context-menu-preview"
            action={() => {
                if (showPreviewModal && isSDKPreviewEnabled && nodeUid) {
                    showPreviewModal({
                        deprecatedContextShareId: shareId,
                        nodeUid,
                    });
                } else {
                    openLegacyPreview(shareId, linkId);
                }
            }}
            close={close}
        />
    );
};

export default PreviewButton;
