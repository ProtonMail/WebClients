import { type FC, type ReactNode } from 'react';

import { Button } from '@proton/atoms/Button';
import { Icon } from '@proton/components/components';
import clsx from '@proton/utils/clsx';

type TopBarProps = {
    children: ReactNode;
    visible: boolean;
    className?: string;
    closable?: boolean;
    onClose?: () => void;
};

export const TopBar: FC<TopBarProps> = ({ children, visible, className, closable = false, onClose }) => {
    return (
        <div className={clsx('anime-reveal hidden md:block text-sm', !visible && 'anime-reveal--hidden', className)}>
            <div className="flex gap-2 shrink-0 flex-1 items-center px-3 py-2 pass-spotlight-content weak">
                {children}
                {closable && (
                    <Button className="ml-auto" pill size="small" shape="ghost" onClick={onClose}>
                        <Icon name="cross" />
                    </Button>
                )}
            </div>
        </div>
    );
};
