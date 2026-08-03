import { forwardRef } from 'react';

import { Button, type ButtonProps } from '@proton/atoms/Button/Button';
import clsx from '@proton/utils/clsx';

import { NewPill } from '../NewPill/NewPill';

import './ExpandOptionsButton.scss';

const ConditionalNewPill = ({ newPill, children }: { newPill: boolean; children: React.ReactNode }) => {
    if (newPill) {
        return <NewPill>{children}</NewPill>;
    }
    return children;
};

export const ExpandOptionsButton = forwardRef<
    HTMLButtonElement,
    ButtonProps & {
        ref?: React.RefObject<HTMLButtonElement>;
        className?: string;
        containerClassName?: string;
        children: React.ReactNode;
        newPill?: boolean;
        onClick: () => void;
    }
>(({ className, containerClassName, children, onClick, newPill = false, ...rest }, ref) => (
    <div className={clsx('w-full flex flex-nowrap items-center justify-end gap-2', containerClassName)}>
        <ConditionalNewPill newPill={newPill}>
            <Button
                ref={ref}
                className={clsx(
                    'options-expand-button flex items-center flex-nowrap text-nowrap rounded-full',
                    className
                )}
                shape="ghost"
                onClick={onClick}
                {...rest}
            >
                {children}
            </Button>
        </ConditionalNewPill>
    </div>
));

ExpandOptionsButton.displayName = 'ExpandOptionsButton';
