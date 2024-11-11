import React from 'react';

import Icon, { type IconName } from '@proton/components/components/icon/Icon';
import clsx from '@proton/utils/clsx';

export enum DeprecatedBannerBackgroundColor {
    NORM = 'norm',
    WEAK = 'weak',
    STRONG = 'strong',
    INFO = 'info',
    WARNING = 'warning',
    DANGER = 'danger',
    SUCCESS = 'success',
}

enum IconColor {
    WARNING = 'warning',
    DANGER = 'danger',
}

interface DeprecatedBannerProps {
    backgroundColor?: DeprecatedBannerBackgroundColor;
    iconColor?: IconColor;
    icon?: IconName;
    action?: React.ReactNode;
    children: React.ReactNode;
}

/**
 * @deprecated please use Banner from @proton/atoms
 */
const DeprecatedBanner = ({
    backgroundColor = DeprecatedBannerBackgroundColor.NORM,
    icon,
    iconColor,
    action,
    children,
}: DeprecatedBannerProps) => {
    const getIcon = () => {
        if (!icon) {
            return null;
        }

        return <Icon name={icon} className={clsx(['mr-3 ml-0.5 shrink-0', `color-${iconColor}`])} />;
    };

    const borderColor =
        backgroundColor === DeprecatedBannerBackgroundColor.INFO ||
        backgroundColor === DeprecatedBannerBackgroundColor.WARNING ||
        backgroundColor === DeprecatedBannerBackgroundColor.DANGER ||
        backgroundColor === DeprecatedBannerBackgroundColor.SUCCESS
            ? `border-${backgroundColor}`
            : null;

    return (
        <div
            className={`bg-${backgroundColor} border ${borderColor} rounded px-2 py-1 mb-3 flex items-center flex-nowrap`}
        >
            {getIcon()}
            <span className={clsx([!!action && 'mr-4'])}>{children}</span>
            {action}
        </div>
    );
};

export default DeprecatedBanner;
