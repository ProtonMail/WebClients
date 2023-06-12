import React from 'react';

import clsx from '@proton/utils/clsx';

import { Icon, IconName } from '../icon';

export enum BannerBackgroundColor {
    NORM = 'norm',
    WEAK = 'weak',
    STRONG = 'strong',
    INFO = 'info',
    WARNING = 'warning',
    DANGER = 'danger',
    SUCCESS = 'success',
}

export enum IconColor {
    WARNING = 'warning',
    DANGER = 'danger',
}

export interface BannerProps {
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

        return <Icon name={icon} className={clsx(['mr-3 ml-0.5 flex-item-noshrink', `color-${iconColor}`])} />;
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
            className={`bg-${backgroundColor} border ${borderColor} rounded px-2 py-1 mb-3 flex flex-align-items-center flex-nowrap`}
        >
            {getIcon()}
            <span className={clsx([!!action && 'mr-4'])}>{children}</span>
            {action}
        </div>
    );
};

export default Banner;
