import { c } from 'ttag';

import { Icon, ToolbarButton } from '@proton/components';
import { isPreviewAvailable } from '@proton/shared/lib/helpers/preview';

import { DecryptedLink } from '../../../store';
import useOpenModal from '../../useOpenModal';
import { hasFoldersSelected, isMultiSelect } from './utils';

interface Props {
    selectedLinks: DecryptedLink[];
}

const PreviewButton = ({ selectedLinks }: Props) => {
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
                    openPreview(selectedLinks[0].rootShareId, selectedLinks[0].linkId);
                }
            }}
            data-testid="toolbar-preview"
        />
    );
};

export default PreviewButton;
