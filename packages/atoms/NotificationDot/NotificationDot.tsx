import { ComponentPropsWithoutRef } from 'react';

import { ThemeColor } from '@proton/colors';

import clsx from '../clsx';
import './NotificationDot.scss';

export type NotificationDotColor = `${ThemeColor.Warning | ThemeColor.Danger}`;

export interface NotificationDotProps extends ComponentPropsWithoutRef<'span'> {
    /**
     * Controls the color of the dot.
     */
    color: NotificationDotColor;
}

const NotificationDot = ({ color, className, ...rest }: NotificationDotProps) => {
    return <span className={clsx(className, 'notification-dot rounded-50', `bg-${color}`)} {...rest} />;
};

export default NotificationDot;
