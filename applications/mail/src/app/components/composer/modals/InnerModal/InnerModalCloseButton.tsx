import { c } from 'ttag';

import { Button } from '@proton/atoms';
import { Icon } from '@proton/components';

interface InnerModalModalCloseButtonProps {
    onClose?: () => void;
    closeTextModal?: string;
}

const InnerModalModalCloseButton = ({ closeTextModal, onClose }: InnerModalModalCloseButtonProps) => {
    const closeText = closeTextModal || c('Action').t`Close`;

    return (
        <Button
            icon
            shape="ghost"
            size="small"
            className="inner-modal-close mt-5 mr-5"
            title={closeText}
            onClick={onClose}
        >
            <Icon className="inner-modal-close-icon" name="cross-big" alt={closeText} />
        </Button>
    );
};

export default InnerModalModalCloseButton;
