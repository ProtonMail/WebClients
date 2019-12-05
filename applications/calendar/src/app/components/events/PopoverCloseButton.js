import React from 'react';
import { c } from 'ttag';
import { Icon } from 'react-components';

const PopoverCloseButton = ({ onClose }) => {
    return (
        <button type="button" className="pm-modalClose" title={c('Action').t`Close popover`} onClick={onClose}>
            <Icon className="pm-modalClose-icon" name="close" />
            <span className="sr-only">{c('Action').t`Close popover`}</span>
        </button>
    );
};

export default PopoverCloseButton;
