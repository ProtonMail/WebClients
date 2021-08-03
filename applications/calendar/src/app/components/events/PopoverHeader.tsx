import * as React from 'react';
import PopoverCloseButton from './PopoverCloseButton';

interface Props {
    children?: React.ReactNode;
    actions?: React.ReactNode;
    onClose: () => void;
    className?: string;
}

const PopoverHeader = ({ children, onClose, actions, ...rest }: Props) => {
    return (
        <header {...rest}>
            <div className="eventpopover-actions flex flex-justify-end">
                {actions}
                {!!actions && <span className="eventpopover-actions-separator" />}
                <PopoverCloseButton onClose={onClose} />
            </div>
            {children}
        </header>
    );
};

export default PopoverHeader;
