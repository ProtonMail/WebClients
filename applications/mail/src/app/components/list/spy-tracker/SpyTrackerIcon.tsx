import type { Ref } from 'react';
import { forwardRef } from 'react';

import { IcShield2 } from '@proton/icons/icons/IcShield2';
import { IcShield2CheckFilled } from '@proton/icons/icons/IcShield2CheckFilled';
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

    const iconClassName = clsx(
        needsMoreProtection ? 'color-weak' : 'color-primary',
        'relative inline-flex item-spy-tracker-link items-center',
        isStandaloneIcon && 'mr-0.5',
        className
    );
    const icon = needsMoreProtection ? (
        <IcShield2
            size={4}
            alt={title}
            data-testid="privacy:tracker-icon"
            data-protection-enabled="false"
            className={iconClassName}
        />
    ) : (
        <IcShield2CheckFilled
            size={4}
            alt={title}
            data-testid="privacy:tracker-icon"
            data-protection-enabled="true"
            className={iconClassName}
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
