import { forwardRef } from 'react';

import { Button, type ButtonProps } from '@proton/atoms/Button/Button';
import clsx from '@proton/utils/clsx';

import './ExpandOptionsButton.scss';

export const ExpandOptionsButton = forwardRef<
    HTMLButtonElement,
    ButtonProps & {
        ref?: React.RefObject<HTMLButtonElement>;
        className?: string;
        containerClassName?: string;
        children: React.ReactNode;
        onClick: () => void;
    }
>(({ className, containerClassName, children, onClick, ...rest }, ref) => (
    <div className={clsx('w-full flex flex-nowrap items-center justify-end gap-2', containerClassName)}>
        <Button
            ref={ref}
            className={clsx('options-expand-button flex items-center flex-nowrap text-nowrap rounded-full', className)}
            shape="ghost"
            onClick={onClick}
            {...rest}
        >
            {children}
        </Button>
    </div>
));

ExpandOptionsButton.displayName = 'ExpandOptionsButton';
