import type { Ref } from 'react';

import { c } from 'ttag';

import { DropdownCaret } from '@proton/components';
import { IcLifeRing } from '@proton/icons/icons/IcLifeRing';
import clsx from '@proton/utils/clsx';

interface Props extends React.DetailedHTMLProps<React.ButtonHTMLAttributes<HTMLButtonElement>, HTMLButtonElement> {
    children?: React.ReactNode;
    className?: string;
    isOpen?: boolean;
    noCaret?: boolean;
    buttonRef?: Ref<HTMLButtonElement>;
}

const defaultChildren = (
    <>
        <IcLifeRing className="shrink-0 mr-2 self-center my-auto" />
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
            className={clsx('support-dropdown-button', className)}
            aria-expanded={isOpen}
            ref={buttonRef}
            {...rest}
        >
            {children}
            {noCaret ? null : <DropdownCaret isOpen={isOpen} className="ml-2 expand-caret my-auto" />}
        </button>
    );
};

export default SupportDropdownButton;
