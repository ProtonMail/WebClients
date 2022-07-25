import { c } from 'ttag';

import { DecryptedLink } from '../../../../store';
import useOpenModal from '../../../useOpenModal';
import ContextMenuButton from '../ContextMenuButton';

interface Props {
    selectedLinks: DecryptedLink[];
    close: () => void;
}

const DetailsButton = ({ selectedLinks, close }: Props) => {
    const { openDetails, openFilesDetails } = useOpenModal();

    return (
        <ContextMenuButton
            name={c('Action').t`Details`}
            icon="info-circle"
            testId="context-menu-details"
            action={() => {
                if (selectedLinks.length === 1) {
                    openDetails(selectedLinks[0].rootShareId, selectedLinks[0].linkId);
                } else if (selectedLinks.length > 1) {
                    openFilesDetails(selectedLinks);
                }
            }}
            close={close}
        />
    );
};

export default DetailsButton;
