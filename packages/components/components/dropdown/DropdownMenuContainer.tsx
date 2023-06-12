import { ReactNode, Ref, forwardRef } from 'react';

import clsx from '@proton/utils/clsx';

import DropdownMenuButton, { Props as DropdownMenuButtonProps } from './DropdownMenuButton';

export interface Props extends DropdownMenuButtonProps {
    buttonContent?: ReactNode;
    extraContent?: ReactNode;
    buttonRef?: Ref<HTMLButtonElement>;
    className?: string;
    buttonClassName?: string;
}

const DropdownMenuContainer = (
    { buttonContent, extraContent, buttonRef, className, buttonClassName, ...rest }: Props,
    ref: Ref<HTMLDivElement>
) => {
    return (
        <div
            ref={ref}
            className={clsx([
                'dropdown-item-container flex flex-justify-space-between flex-nowrap relative',
                className,
            ])}
        >
            <DropdownMenuButton ref={buttonRef} className={clsx(['increase-click-surface', buttonClassName])} {...rest}>
                {buttonContent}
            </DropdownMenuButton>
            {extraContent || null}
        </div>
    );
};

export default forwardRef(DropdownMenuContainer);
