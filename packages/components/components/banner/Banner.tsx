import React from 'react';

import { classnames } from '../../helpers';
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

        return <Icon name={icon} className={classnames(['mr0-75 ml0-2 flex-item-noshrink', `color-${iconColor}`])} />;
    };

    return (
        <div
            className={`bg-${backgroundColor} rounded px0-5 py0-25 mb0-75 flex flex-align-items-center flex-nowrap border`}
        >
            {getIcon()}
            <span className={classnames([!!action && 'mr1'])}>{children}</span>
            {action}
        </div>
    );
};

export default Banner;
