import { c } from 'ttag';

import { Icon, ToolbarButton } from '@proton/components';

import { DecryptedLink } from '../../../store';
import { useDetailsModal } from '../../modals/DetailsModal';
import { useFilesDetailsModal } from '../../modals/FilesDetailsModal';
import { noSelection } from './utils';

interface Props {
    selectedLinks: DecryptedLink[];
}

const DetailsButton = ({ selectedLinks }: Props) => {
    const [filesDetailsModal, showFilesDetailsModal] = useFilesDetailsModal();
    const [detailsModal, showDetailsModal] = useDetailsModal();

    if (noSelection(selectedLinks)) {
        return null;
    }

    return (
        <>
            <ToolbarButton
                title={c('Action').t`Details`}
                icon={<Icon name="info-circle" alt={c('Action').t`Details`} />}
                onClick={() => {
                    if (selectedLinks.length === 1) {
                        void showDetailsModal({
                            shareId: selectedLinks[0].rootShareId,
                            linkId: selectedLinks[0].linkId,
                        });
                    } else if (selectedLinks.length > 1) {
                        void showFilesDetailsModal({ selectedItems: selectedLinks });
                    }
                }}
                data-testid="toolbar-details"
            />
            {detailsModal}
            {filesDetailsModal}
        </>
    );
};

export default DetailsButton;
