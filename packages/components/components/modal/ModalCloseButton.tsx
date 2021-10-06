import * as React from 'react';
import { c } from 'ttag';

import { Button } from '../button';
import { Icon } from '../icon';

interface ModalCloseButtonProps {
    onClose?: () => void;
    closeTextModal?: string;
}

const ModalCloseButton = ({ closeTextModal, onClose }: ModalCloseButtonProps) => {
    const closeText = closeTextModal || c('Action').t`Close modal`;

    return (
        <Button icon shape="ghost" size="small" className="modal-close" title={closeText} onClick={onClose}>
            <Icon className="modal-close-icon" name="xmark" alt={closeText} />
        </Button>
    );
};

export default ModalCloseButton;
