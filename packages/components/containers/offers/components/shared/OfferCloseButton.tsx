import { c } from 'ttag';

import { Button } from '@proton/atoms';
import { Tooltip } from '@proton/components/components';
import Icon from '@proton/components/components/icon/Icon';
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
                    'shrink-0 offer-close-button absolute right-0 mr-2 top-custom',
                    darkBackground && 'offer-close-button--dark'
                )}
                icon
                shape="ghost"
                onClick={onClose}
                style={{
                    '--top-custom': '8px',
                }}
            >
                <Icon className="modal-close-icon" size={3} name="cross-big" alt={c('specialoffer: Action').t`Close`} />
            </Button>
        </Tooltip>
    );
};

export default OfferCloseButton;
