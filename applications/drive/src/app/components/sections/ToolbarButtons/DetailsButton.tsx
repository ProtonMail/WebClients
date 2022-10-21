import { c } from 'ttag';

import { Icon, ToolbarButton } from '@proton/components';

import { DecryptedLink } from '../../../store';
import useOpenModal from '../../useOpenModal';
import { noSelection } from './utils';

interface Props {
    selectedLinks: DecryptedLink[];
}

const DetailsButton = ({ selectedLinks }: Props) => {
    const { openDetails, openFilesDetails } = useOpenModal();

    if (noSelection(selectedLinks)) {
        return null;
    }

    return (
        <ToolbarButton
            title={c('Action').t`Details`}
            icon={<Icon name="info-circle" />}
            onClick={() => {
                if (selectedLinks.length === 1) {
                    openDetails(selectedLinks[0].rootShareId, selectedLinks[0].linkId);
                } else if (selectedLinks.length > 1) {
                    openFilesDetails(selectedLinks);
                }
            }}
            data-testid="toolbar-details"
        />
    );
};

export default DetailsButton;
