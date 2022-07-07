import { ComponentPropsWithoutRef } from 'react';

import { getVariableFromThemeColor, ThemeColor } from '@proton/colors';

import clsx from '@proton/utils/clsx';

import './NotificationDot.scss';

export interface NotificationDotProps extends ComponentPropsWithoutRef<'span'> {
    /**
     * Controls the color of the dot.
     */
    color?: ThemeColor;
}

const NotificationDot = ({ color = ThemeColor.Norm, className, ...rest }: NotificationDotProps) => {
    return (
        <span
            className={clsx(className, 'notification-dot rounded-50')}
            style={{ backgroundColor: `var(${getVariableFromThemeColor(color)})` }}
            {...rest}
        />
    );
};

export default NotificationDot;
