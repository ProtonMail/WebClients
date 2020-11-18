import React from 'react';
import { classnames } from '../../helpers';
import DropdownCaret from './DropdownCaret';

export interface Props
    extends React.DetailedHTMLProps<React.ButtonHTMLAttributes<HTMLButtonElement>, HTMLButtonElement> {
    loading?: boolean;
    buttonRef?: React.Ref<HTMLButtonElement>;
    icon?: React.ReactNode;
    caretClassName?: string;
    hasCaret?: boolean;
    isOpen?: boolean;
    children?: React.ReactNode;
    className?: string;
    disabled?: boolean;
}

const DropdownButton = ({
    children,
    buttonRef,
    className = 'pm-button',
    hasCaret = false,
    isOpen = false,
    caretClassName = '',
    disabled = false,
    loading = false,
    ...rest
}: Props) => {
    return (
        <button
            ref={buttonRef}
            type="button"
            className={classnames(['flex-item-noshrink', className])}
            aria-expanded={isOpen}
            aria-busy={loading}
            disabled={loading ? true : disabled}
            data-testid="dropdown-button"
            {...rest}
        >
            <span className="mauto">
                <span className={classnames([hasCaret && children ? 'mr0-5' : undefined])}>{children}</span>
                {hasCaret && <DropdownCaret className={caretClassName} isOpen={isOpen} />}
            </span>
        </button>
    );
};

export default DropdownButton;
