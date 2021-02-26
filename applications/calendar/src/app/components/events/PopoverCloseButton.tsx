import React from 'react';
import { c } from 'ttag';
import { Button } from 'react-components';

interface Props {
    onClose: () => void;
}

const PopoverCloseButton = ({ onClose }: Props) => {
    return (
        <Button
            shape="ghost"
            size="small"
            className="modal-close"
            icon="close"
            iconProps={{ alt: c('Action').t`Close popover` }}
            title={c('Action').t`Close popover`}
            onClick={onClose}
        />
    );
};

export default PopoverCloseButton;
