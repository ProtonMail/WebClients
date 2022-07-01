import { isPreviewAvailable } from '@proton/shared/lib/helpers/preview';
import { c } from 'ttag';

import { Icon, ToolbarButton } from '@proton/components';

import { DecryptedLink } from '../../../store';
import useOpenModal from '../../useOpenModal';
import { isMultiSelect, hasFoldersSelected } from './utils';

interface Props {
    shareId: string;
    selectedLinks: DecryptedLink[];
}

const PreviewButton = ({ shareId, selectedLinks }: Props) => {
    const { openPreview } = useOpenModal();

    const disabled =
        isMultiSelect(selectedLinks) ||
        hasFoldersSelected(selectedLinks) ||
        !selectedLinks[0]?.mimeType ||
        !isPreviewAvailable(selectedLinks[0].mimeType, selectedLinks[0].size);
    if (disabled) {
        return null;
    }

    return (
        <ToolbarButton
            title={c('Action').t`Preview`}
            icon={<Icon name="eye" />}
            onClick={() => {
                if (selectedLinks.length) {
                    openPreview(shareId, selectedLinks[0].linkId);
                }
            }}
            data-testid="toolbar-preview"
        />
    );
};

export default PreviewButton;
