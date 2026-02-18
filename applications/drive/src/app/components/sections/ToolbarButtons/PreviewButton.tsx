import { c } from 'ttag';

import { ToolbarButton } from '@proton/components';
import { IcEye } from '@proton/icons/icons/IcEye';
import { isPreviewAvailable } from '@proton/shared/lib/helpers/preview';

import { useFlagsDriveSDKPreview } from '../../../flags/useFlagsDriveSDKPreview';
import { useDrivePreviewModal } from '../../../modals/preview';
import useOpenPreview from '../../useOpenPreview';
import { hasFoldersSelected, isMultiSelect } from './utils';

interface Props {
    selectedBrowserItems: {
        rootShareId: string;
        linkId: string;
        mimeType: string;
        size?: number;
        isFile: boolean;
        // Various sections use uid or nodeUid. It is the same thing.
        // Only new sections include UIDs. We allow new preview only for new sections.
        // TODO: Each section should use own button or it must be unified.
        uid?: string;
        nodeUid?: string;
    }[];
}

const PreviewButton = ({ selectedBrowserItems }: Props) => {
    const openLegacyPreview = useOpenPreview();
    const { previewModal, showPreviewModal } = useDrivePreviewModal();

    const isSDKPreviewEnabled = useFlagsDriveSDKPreview();

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
                        const nodeUid = selectedBrowserItems[0].nodeUid || selectedBrowserItems[0].uid;
                        if (isSDKPreviewEnabled && nodeUid) {
                            showPreviewModal({
                                deprecatedContextShareId: selectedBrowserItems[0].rootShareId,
                                nodeUid,
                            });
                        } else {
                            openLegacyPreview(selectedBrowserItems[0].rootShareId, selectedBrowserItems[0].linkId);
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
