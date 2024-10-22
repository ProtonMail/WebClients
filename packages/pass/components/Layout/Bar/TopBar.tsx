import { type FC, type ReactNode } from 'react';

import { Button } from '@proton/atoms';
import { Icon } from '@proton/components';
import clsx from '@proton/utils/clsx';

import './TopBar.scss';

type TopBarProps = {
    breakpoint?: 'sm' | 'md' | 'lg' | 'xl';
    children: ReactNode;
    className?: string;
    visible: boolean;
    onClose?: () => void;
};

export const TopBar: FC<TopBarProps> = ({ breakpoint, children, className, visible, onClose }) => (
    <div
        className={clsx(
            'anime-reveal text-sm shrink-0',
            !visible && 'anime-reveal--hidden',
            breakpoint && `hidden ${breakpoint}:block`
        )}
    >
        <div className={clsx('pass-top-bar flex gap-2 shrink-0 flex-1 items-center px-3 py-2', className)}>
            {children}
            {onClose && (
                <Button className="ml-auto" pill size="small" shape="ghost" onClick={onClose}>
                    <Icon name="cross" />
                </Button>
            )}
        </div>
    </div>
);
