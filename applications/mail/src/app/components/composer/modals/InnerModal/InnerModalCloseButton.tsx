import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import { IcCrossBig } from '@proton/icons';

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
            <IcCrossBig className="inner-modal-close-icon"  alt={closeText} />
        </Button>
    );
};

export default InnerModalModalCloseButton;
