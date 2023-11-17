import { Ref } from 'react';

import { c } from 'ttag';



import { DropdownCaret, Icon } from '@proton/components';
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
        <Icon name="life-ring" className="shrink-0 mr-2 flex-item-centered-vert" />
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
