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

export interface BannerProps {
    backgroundColor?: BannerBackgroundColor;
    icon?: React.ReactNode;
    action?: React.ReactNode;
    children: React.ReactNode;
}

const Banner = ({ backgroundColor = BannerBackgroundColor.NORM, icon, action, children }: BannerProps) => {
    const getIcon = () => {
        if (!icon) {
            return null;
        }

        if (typeof icon === 'string') {
            return <Icon name={icon} className="mr0-75 flex-item-noshrink" />;
        }

        return icon;
    };

    return (
        <div className={`bg-${backgroundColor} rounded p0-75 mb0-5 flex flex-align-items-center flex-nowrap`}>
            {getIcon()}
            <span className={classnames([!!action && 'mr1'])}>{children}</span>
            {action}
        </div>
    );
};

export default Banner;
