import * as React from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms';
import Icon from '@proton/components/components/icon/Icon';

interface ModalCloseButtonProps {
    onClose?: () => void;
    closeTextModal?: string;
}

/**
 * @deprecated Please use ModalTwo instead
 */
const ModalCloseButton = ({ closeTextModal, onClose }: ModalCloseButtonProps) => {
    const closeText = closeTextModal || c('Action').t`Close`;

    return (
        <Button icon shape="ghost" size="small" className="modal-close" title={closeText} onClick={onClose}>
            <Icon className="modal-close-icon" name="cross" alt={closeText} />
        </Button>
    );
};

export default ModalCloseButton;
