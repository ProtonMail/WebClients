import React, { Ref } from 'react';
import { c } from 'ttag';

import { Icon, DropdownCaret, classnames } from '@proton/components';

interface Props extends React.DetailedHTMLProps<React.ButtonHTMLAttributes<HTMLButtonElement>, HTMLButtonElement> {
    children?: React.ReactNode;
    className?: string;
    isOpen?: boolean;
    noCaret?: boolean;
    buttonRef?: Ref<HTMLButtonElement>;
}

const defaultChildren = (
    <>
        <Icon name="support1" className="flex-item-noshrink mr0-5 flex-item-centered-vert" />
        <span>{c('Action').t`Support`}</span>
    </>
);

const SupportDropdownButton = ({
    children = defaultChildren,
    className,
    isOpen,
    noCaret = false,
    buttonRef,
    ...rest
}: Props) => {
    return (
        <button
            type="button"
            className={classnames(['support-dropdown-button', className])}
            aria-expanded={isOpen}
            ref={buttonRef}
            {...rest}
        >
            {children}
            {noCaret ? null : <DropdownCaret isOpen={isOpen} className="ml0-5 expand-caret mtauto mbauto" />}
        </button>
    );
};

export default SupportDropdownButton;
