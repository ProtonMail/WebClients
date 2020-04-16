import PopoverCloseButton from './PopoverCloseButton';
import React from 'react';

interface Props {
    children?: React.ReactNode;
    onClose: () => void;
}

const PopoverHeader = ({ children, onClose }: Props) => {
    return (
        <header>
            {children}
            <PopoverCloseButton onClose={onClose} />
        </header>
    );
};

export default PopoverHeader;
