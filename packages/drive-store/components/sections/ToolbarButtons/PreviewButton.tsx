import { c } from 'ttag';

import { ToolbarButton } from '@proton/components';
import { IcEye } from '@proton/icons/icons/IcEye';
import { isPreviewAvailable } from '@proton/shared/lib/helpers/preview';

import useOpenPreview from '../../useOpenPreview';
import { hasFoldersSelected, isMultiSelect } from './utils';

interface Props {
    selectedBrowserItems: { rootShareId: string; linkId: string; mimeType: string; size?: number; isFile: boolean }[];
}

const PreviewButton = ({ selectedBrowserItems }: Props) => {
    const openPreview = useOpenPreview();

    const disabled =
        isMultiSelect(selectedBrowserItems) ||
        hasFoldersSelected(selectedBrowserItems) ||
        !selectedBrowserItems[0]?.mimeType ||
        !isPreviewAvailable(selectedBrowserItems[0].mimeType, selectedBrowserItems[0].size);
    if (disabled) {
        return null;
    }

    return (
        <ToolbarButton
            title={c('Action').t`Preview`}
            icon={<IcEye alt={c('Action').t`Preview`} />}
            onClick={() => {
                if (selectedBrowserItems.length) {
                    openPreview(selectedBrowserItems[0].rootShareId, selectedBrowserItems[0].linkId);
                }
            }}
            data-testid="toolbar-preview"
        />
    );
};

export default PreviewButton;
