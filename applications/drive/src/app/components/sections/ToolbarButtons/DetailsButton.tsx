import { c } from 'ttag';

import { Icon, ToolbarButton } from '@proton/components';

import useOpenModal from '../../useOpenModal';
import { noSelection } from './utils';

interface Props {
    shareId: string;
    linkIds: string[];
}

const DetailsButton = ({ shareId, linkIds }: Props) => {
    const { openDetails, openFilesDetails } = useOpenModal();

    if (noSelection(linkIds)) {
        return null;
    }

    return (
        <ToolbarButton
            title={c('Action').t`Details`}
            icon={<Icon name="info-circle" />}
            onClick={() => {
                if (linkIds.length === 1) {
                    openDetails(shareId, linkIds[0]);
                } else if (linkIds.length > 1) {
                    openFilesDetails(shareId, linkIds);
                }
            }}
            data-testid="toolbar-details"
        />
    );
};

export default DetailsButton;
