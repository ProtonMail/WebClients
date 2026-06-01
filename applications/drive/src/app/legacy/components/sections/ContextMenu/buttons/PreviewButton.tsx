import { c } from 'ttag';

import { generateNodeUid, getDrive } from '@proton/drive';

import { useDrivePreviewModal } from '../../../../../modals/preview';
import { ContextMenuButton } from '../../../../../statelessComponents/ContextMenu';

interface Props {
    shareId: string;
    volumeId: string;
    linkId: string;
    close: () => void;
}

const PreviewButton = ({ shareId, volumeId, linkId, close }: Props) => {
    const { previewModal, showPreviewModal } = useDrivePreviewModal();
    const nodeUid = generateNodeUid(volumeId, linkId);
    return (
        <>
            <ContextMenuButton
                name={c('Action').t`Preview`}
                icon="eye"
                testId="context-menu-preview"
                action={() => {
                    showPreviewModal({
                        deprecatedContextShareId: shareId,
                        nodeUid,
                        drive: getDrive(),
                    });
                }}
                close={close}
            />
            {previewModal}
        </>
    );
};

export default PreviewButton;
