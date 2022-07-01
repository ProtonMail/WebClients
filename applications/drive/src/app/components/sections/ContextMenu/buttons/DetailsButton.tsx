import { useCallback } from 'react';
import { c } from 'ttag';

import useOpenModal from '../../../useOpenModal';
import ContextMenuButton from '../ContextMenuButton';

interface Props {
    shareId: string;
    linkIds: string[];
    close: () => void;
}

const DetailsButton = ({ shareId, linkIds, close }: Props) => {
    const { openDetails, openFilesDetails } = useOpenModal();

    const action = useCallback(() => {
        if (linkIds.length === 1) {
            openDetails(shareId, linkIds[0]);
        } else {
            openFilesDetails(shareId, linkIds);
        }
    }, [shareId, linkIds, openDetails, openFilesDetails]);

    return (
        <ContextMenuButton
            name={c('Action').t`Details`}
            icon="info-circle"
            testId="context-menu-details"
            action={action}
            close={close}
        />
    );
};

export default DetailsButton;
