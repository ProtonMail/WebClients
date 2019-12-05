import PopoverCloseButton from './PopoverCloseButton';
import React from 'react';

const PopoverHeader = ({ children, onClose }) => {
    return (
        <header>
            {children}
            <PopoverCloseButton onClose={onClose} />
        </header>
    )
};

export default PopoverHeader;
