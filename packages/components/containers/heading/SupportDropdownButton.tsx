import React, { Ref } from 'react';
import { c } from 'ttag';
import { Icon, DropdownCaret } from '../../components';

interface Props extends React.DetailedHTMLProps<React.ButtonHTMLAttributes<HTMLButtonElement>, HTMLButtonElement> {
    content?: string;
    className?: string;
    isOpen?: boolean;
    buttonRef?: Ref<HTMLButtonElement>;
    noCaret?: boolean;
}

const SupportDropdownButton = ({
    content = c('Header').t`Help`,
    className,
    isOpen,
    buttonRef,
    noCaret,
    ...rest
}: Props) => {
    return (
        <button title={content} type="button" className={className} aria-expanded={isOpen} ref={buttonRef} {...rest}>
            <Icon name="support1" className="flex-item-noshrink topnav-icon mr0-5 flex-item-centered-vert" />
            <span className="navigation-title topnav-linkText mr0-5">{content}</span>
            {!noCaret ? <DropdownCaret isOpen={isOpen} className="expand-caret topnav-icon mtauto mbauto" /> : null}
        </button>
    );
};

export default SupportDropdownButton;
