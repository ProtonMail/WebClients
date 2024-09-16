import type { ReactNode, Ref } from 'react';
import { forwardRef } from 'react';

import type { Props as DropdownMenuButtonProps } from '@proton/components/components/dropdown/DropdownMenuButton';
import DropdownMenuButton from '@proton/components/components/dropdown/DropdownMenuButton';
import clsx from '@proton/utils/clsx';

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
            className={clsx(['dropdown-item-container flex justify-space-between flex-nowrap relative', className])}
        >
            <DropdownMenuButton ref={buttonRef} className={clsx(['expand-click-area', buttonClassName])} {...rest}>
                {buttonContent}
            </DropdownMenuButton>
            {extraContent || null}
        </div>
    );
};

export default forwardRef(DropdownMenuContainer);
