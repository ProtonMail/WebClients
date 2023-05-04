import { c } from 'ttag';

import { Button } from '@proton/atoms';
import { Icon, Tooltip } from '@proton/components/components';
import clsx from '@proton/utils/clsx';

interface Props {
    onClose?: () => void;
    darkBackground?: boolean;
}

const OfferCloseButton = ({ onClose, darkBackground = false }: Props) => {
    return (
        <Tooltip title={c('specialoffer: Action').t`Close`}>
            <Button
                className={clsx(
                    'flex-item-noshrink offer-close-button absolute right mr-2 top-custom',
                    darkBackground && 'offer-close-button--dark'
                )}
                icon
                shape="ghost"
                onClick={onClose}
                style={{
                    '--top-custom': '8px',
                }}
            >
                <Icon
                    className="modal-close-icon"
                    size={12}
                    name="cross-big"
                    alt={c('specialoffer: Action').t`Close`}
                />
            </Button>
        </Tooltip>
    );
};

export default OfferCloseButton;
