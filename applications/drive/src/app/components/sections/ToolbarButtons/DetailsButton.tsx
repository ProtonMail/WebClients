import { c } from 'ttag';

import { Icon, ToolbarButton } from '@proton/components';

import { useDetailsModal } from '../../modals/DetailsModal';
import { useFilesDetailsModal } from '../../modals/FilesDetailsModal';
import { noSelection } from './utils';

interface Props {
    selectedBrowserItems: { rootShareId: string; linkId: string; isBookmark?: boolean; isInvitation?: boolean }[];
}

const DetailsButton = ({ selectedBrowserItems }: Props) => {
    const [filesDetailsModal, showFilesDetailsModal] = useFilesDetailsModal();
    const [detailsModal, showDetailsModal] = useDetailsModal();

    if (noSelection(selectedBrowserItems)) {
        return null;
    }

    return (
        <>
            <ToolbarButton
                title={c('Action').t`Details`}
                icon={<Icon name="info-circle" alt={c('Action').t`Details`} />}
                onClick={() => {
                    if (selectedBrowserItems.length === 1) {
                        void showDetailsModal({
                            shareId: selectedBrowserItems[0].rootShareId,
                            linkId: selectedBrowserItems[0].linkId,
                        });
                    } else if (selectedBrowserItems.length > 1) {
                        void showFilesDetailsModal({ selectedItems: selectedBrowserItems });
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
