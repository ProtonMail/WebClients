import { c } from 'ttag';

import { Button } from '@proton/atoms';
import { Icon } from '@proton/components';

import usePublicToken from '../../hooks/drive/usePublicToken';
import { usePublicDetailsModal } from '../modals/DetailsModal';

interface Props {
    className?: string;
    linkId: string;
}

const DetailsButton = ({ className, linkId }: Props) => {
    const [publicDetailsModal, showPublicDetailsModal] = usePublicDetailsModal();
    const { token } = usePublicToken();

    return (
        <>
            <Button
                className={className}
                shape="ghost"
                size="small"
                title={c('Action').t`Details`}
                icon
                onClick={() => {
                    void showPublicDetailsModal({
                        token,
                        linkId,
                    });
                }}
                data-testid="public-details"
            >
                <Icon name="info-circle" alt={c('Action').t`Details`} />
            </Button>
            {publicDetailsModal}
        </>
    );
};

export default DetailsButton;
