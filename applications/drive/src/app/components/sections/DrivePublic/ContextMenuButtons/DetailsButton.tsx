import { c } from 'ttag';

import usePublicToken from '../../../../hooks/drive/usePublicToken';
import type { usePublicDetailsModal } from '../../../modals/DetailsModal';
import { ContextMenuButton } from '../../ContextMenu';

interface Props {
    linkId: string;
    showPublicDetailsModal: ReturnType<typeof usePublicDetailsModal>[1];
    close: () => void;
}

export const DetailsButton = ({ linkId, showPublicDetailsModal, close }: Props) => {
    const { token } = usePublicToken();
    return (
        <ContextMenuButton
            name={c('Action').t`Details`}
            icon="info-circle"
            testId="context-menu-details"
            action={() => {
                void showPublicDetailsModal({
                    token,
                    linkId,
                });
            }}
            close={close}
        />
    );
};
