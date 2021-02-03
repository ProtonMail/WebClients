import React from 'react';
import { c } from 'ttag';
import { Icon } from 'react-components';

interface Props {
    onClose: () => void;
}

const PopoverCloseButton = ({ onClose }: Props) => {
    return (
        <button type="button" className="modal-close" title={c('Action').t`Close popover`} onClick={onClose}>
            <Icon className="modal-close-icon" name="close" />
            <span className="sr-only">{c('Action').t`Close popover`}</span>
        </button>
    );
};

export default PopoverCloseButton;
