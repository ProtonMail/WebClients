import { c } from 'ttag';

import { Button, Icon, Tooltip } from '@proton/components/components';

interface Props {
    onClose?: () => void;
}

const OfferCloseButton = ({ onClose }: Props) => {
    return (
        <Tooltip title={c('specialOffer: Action').t`Close`}>
            <Button
                className="flex-item-noshrink offer-close-button absolute right"
                icon
                shape="ghost"
                onClick={onClose}
            >
                <Icon className="modal-close-icon" name="cross-big" alt={c('specialOffer: Action').t`Close`} />
            </Button>
        </Tooltip>
    );
};

export default OfferCloseButton;
