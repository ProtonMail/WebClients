import { c } from 'ttag';

import { ToolbarButton } from '@proton/components';
import { generateNodeUid, getDrive } from '@proton/drive';
import { IcEye } from '@proton/icons/icons/IcEye';
import { isPreviewAvailable } from '@proton/shared/lib/helpers/preview';

import { useDrivePreviewModal } from '../../../../modals/preview';
import { hasFoldersSelected, isMultiSelect } from './utils';

interface Props {
    selectedBrowserItems: {
        rootShareId: string;
        linkId: string;
        mimeType: string;
        size?: number;
        isFile: boolean;
        uid?: string;
        nodeUid?: string;
        volumeId?: string;
    }[];
}

const PreviewButton = ({ selectedBrowserItems }: Props) => {
    const { previewModal, showPreviewModal } = useDrivePreviewModal();

    const disabled =
        isMultiSelect(selectedBrowserItems) ||
        hasFoldersSelected(selectedBrowserItems) ||
        !selectedBrowserItems[0]?.mimeType ||
        !isPreviewAvailable(selectedBrowserItems[0].mimeType, selectedBrowserItems[0].size);
    if (disabled) {
        return null;
    }

    return (
        <>
            <ToolbarButton
                title={c('Action').t`Preview`}
                icon={<IcEye alt={c('Action').t`Preview`} />}
                onClick={() => {
                    if (selectedBrowserItems.length) {
                        const item = selectedBrowserItems[0];
                        const nodeUid =
                            item.nodeUid ||
                            item.uid ||
                            (item.volumeId ? generateNodeUid(item.volumeId, item.linkId) : undefined);
                        if (nodeUid) {
                            showPreviewModal({
                                deprecatedContextShareId: item.rootShareId,
                                nodeUid,
                                drive: getDrive(),
                            });
                        }
                    }
                }}
                data-testid="toolbar-preview"
            />
            {previewModal}
        </>
    );
};

export default PreviewButton;
