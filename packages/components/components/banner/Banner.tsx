import React from 'react';

import { classnames } from '../../helpers';
import { Icon } from '../icon';

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
    icon?: React.ReactNode;
    action?: React.ReactNode;
    children: React.ReactNode;
}

const Banner = ({ backgroundColor = BannerBackgroundColor.NORM, icon, iconColor, action, children }: BannerProps) => {
    const getIcon = () => {
        if (!icon) {
            return null;
        }

        if (typeof icon === 'string') {
            return <Icon name={icon} className={classnames(['mr0-75 flex-item-noshrink', `color-${iconColor}`])} />;
        }

        return icon;
    };

    return (
        <div className={`bg-${backgroundColor} rounded p0-5 mb0-75 flex flex-align-items-center flex-nowrap border`}>
            {getIcon()}
            <span className={classnames([!!action && 'mr1'])}>{children}</span>
            {action}
        </div>
    );
};

export default Banner;
