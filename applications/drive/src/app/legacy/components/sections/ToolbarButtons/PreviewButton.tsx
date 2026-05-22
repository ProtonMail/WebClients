import { c } from 'ttag';

import { ToolbarButton } from '@proton/components';
import { getDrive } from '@proton/drive';
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
        // Various sections use uid or nodeUid. It is the same thing.
        // Only new sections include UIDs. We allow new preview only for new sections.
        // TODO: Each section should use own button or it must be unified.
        uid?: string;
        nodeUid?: string;
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
                        const nodeUid = selectedBrowserItems[0].nodeUid || selectedBrowserItems[0].uid;
                        if (nodeUid) {
                            showPreviewModal({
                                deprecatedContextShareId: selectedBrowserItems[0].rootShareId,
                                nodeUid,
                                // Force getDrive as it's legacy
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
