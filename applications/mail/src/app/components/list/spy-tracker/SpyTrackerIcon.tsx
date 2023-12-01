import { Ref, forwardRef } from 'react';

import { Icon } from '@proton/components';
import clsx from '@proton/utils/clsx';

interface Props {
    numberOfTrackers: number;
    needsMoreProtection: boolean;
    title: string;
    className?: string;
    onClick?: () => void;
    isStandaloneIcon?: boolean;
}

const SpyTrackerIcon = (
    { numberOfTrackers, needsMoreProtection, title, className, onClick, isStandaloneIcon = false }: Props,
    ref: Ref<HTMLButtonElement>
) => {
    const trackersText = (
        <span data-testid="privacy:icon-number-of-trackers">{numberOfTrackers > 99 ? '99+' : numberOfTrackers}</span>
    );

    const icon = (
        <Icon
            name={needsMoreProtection ? 'shield-2' : 'shield-2-check-filled'}
            size={16}
            alt={title}
            data-testid="privacy:tracker-icon"
            className={clsx(
                needsMoreProtection ? 'color-weak' : 'color-primary',
                'relative inline-flex item-spy-tracker-link items-center',
                isStandaloneIcon && 'mr-0.5',
                className
            )}
        />
    );

    return (
        <div className={clsx(['relative inline-flex item-spy-tracker-link items-center', className])}>
            {onClick ? (
                <button ref={ref} onClick={onClick} className="flex items-center">
                    {icon}
                    {numberOfTrackers > 0 ? trackersText : undefined}
                </button>
            ) : (
                icon
            )}
        </div>
    );
};

export default forwardRef<HTMLButtonElement, Props>(SpyTrackerIcon);
