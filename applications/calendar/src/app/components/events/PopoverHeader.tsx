import React from 'react';
import PopoverCloseButton from './PopoverCloseButton';

interface Props {
    children?: React.ReactNode;
    onClose: () => void;
    className?: string;
}

const PopoverHeader = ({ children, onClose, ...rest }: Props) => {
    return (
        <header {...rest}>
            {children}
            <PopoverCloseButton onClose={onClose} />
        </header>
    );
};

export default PopoverHeader;
