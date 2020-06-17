import React, { RefObject, ReactNode } from 'react';

import DropdownCaret from '../dropdown/DropdownCaret';
import { classnames } from '../../helpers/component';

interface Props {
    buttonRef: RefObject<any>;
    children: ReactNode;
    isOpen: boolean;
    caretClassName?: string;
    className?: string;
    disabled: boolean;
    onClick: () => void;
}

const ContactGroupDropdownButton = ({
    buttonRef,
    caretClassName = '',
    className = '',
    children,
    isOpen,
    disabled,
    onClick,
    ...rest
}: Props) => {
    return (
        <button
            type="button"
            role="button"
            ref={buttonRef}
            className={className}
            disabled={disabled}
            onClick={onClick}
            {...rest}
        >
            {children}
            <DropdownCaret
                isOpen={isOpen}
                className={classnames(['ml0-25 expand-caret mtauto mbauto', caretClassName])}
            />
        </button>
    );
};

export default ContactGroupDropdownButton;
