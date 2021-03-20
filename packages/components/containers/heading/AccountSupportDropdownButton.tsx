import React from 'react';
import { c } from 'ttag';

import { Icon, DropdownCaret } from '../../components';
import { classnames } from '../../helpers';

interface Props extends React.DetailedHTMLProps<React.ButtonHTMLAttributes<HTMLButtonElement>, HTMLButtonElement> {
    children?: React.ReactNode;
    className?: string;
    isOpen?: boolean;
    noCaret?: boolean;
}

const defaultChildren = (
    <>
        <Icon name="support1" className="flex-item-noshrink mr0-5 flex-item-centered-vert" />
        <span>{c('Action').t`Support`}</span>
    </>
);

const AccountSupportDropdownButton = (
    { children = defaultChildren, className, isOpen, noCaret = false, ...rest }: Props,
    ref: React.Ref<HTMLButtonElement>
) => {
    return (
        <button
            type="button"
            className={classnames(['support-dropdown-button', className])}
            aria-expanded={isOpen}
            ref={ref}
            {...rest}
        >
            {children}
            {noCaret ? null : <DropdownCaret isOpen={isOpen} className="ml0-5 expand-caret mtauto mbauto" />}
        </button>
    );
};

export default React.forwardRef<HTMLButtonElement, Props>(AccountSupportDropdownButton);
