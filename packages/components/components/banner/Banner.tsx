import React from 'react';

import Icon, { type IconName } from '@proton/components/components/icon/Icon';
import clsx from '@proton/utils/clsx';

export enum BannerBackgroundColor {
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

interface BannerProps {
    backgroundColor?: BannerBackgroundColor;
    iconColor?: IconColor;
    icon?: IconName;
    action?: React.ReactNode;
    children: React.ReactNode;
}

const Banner = ({ backgroundColor = BannerBackgroundColor.NORM, icon, iconColor, action, children }: BannerProps) => {
    const getIcon = () => {
        if (!icon) {
            return null;
        }

        return <Icon name={icon} className={clsx(['mr-3 ml-0.5 shrink-0', `color-${iconColor}`])} />;
    };

    const borderColor =
        backgroundColor === BannerBackgroundColor.INFO ||
        backgroundColor === BannerBackgroundColor.WARNING ||
        backgroundColor === BannerBackgroundColor.DANGER ||
        backgroundColor === BannerBackgroundColor.SUCCESS
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

export default Banner;
