import type { ComponentPropsWithoutRef } from 'react';

import { ThemeColor, getVariableFromThemeColor } from '@proton/colors';
import clsx from '@proton/utils/clsx';

import './NotificationDot.scss';

export interface NotificationDotProps extends ComponentPropsWithoutRef<'span'> {
    /**
     * Controls the color of the dot.
     */
    color?: ThemeColor;
    /**
     * Adds sr-only text for vocalization
     */
    alt?: String;
}

const NotificationDot = ({ color = ThemeColor.Norm, className, alt, ...rest }: NotificationDotProps) => {
    return (
        <span
            className={clsx(className, 'notification-dot rounded-50')}
            style={{ backgroundColor: `var(${getVariableFromThemeColor(color)})` }}
            {...rest}
        >
            {alt && <span className="sr-only">{alt}</span>}
        </span>
    );
};

export default NotificationDot;
