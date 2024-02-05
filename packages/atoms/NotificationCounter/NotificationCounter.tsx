import React, { ComponentPropsWithoutRef } from 'react';

import getVariableFromThemeColor from '@proton/colors/get-variable-from-theme-color';
import { ThemeColor } from '@proton/colors/types';
import clsx from '@proton/utils/clsx';

import './NotificationCounter.scss';

export interface NotificationCounterProps extends ComponentPropsWithoutRef<'span'> {
    /**
     * Controls the color of the dot.
     */
    color?: ThemeColor;
    /**
     * Adds sr-only text for vocalization
     */
    alt?: String;
    /**
     * Current count to display
     */
    count: number;
}

const NotificationCounter = ({ className, count, alt, color = ThemeColor.Norm, ...rest }: NotificationCounterProps) => {
    return (
        <span
            className={clsx(className, 'notification-counter flex color-invert absolute rounded-50 text-sm')}
            style={{ backgroundColor: `var(${getVariableFromThemeColor(color)})` }}
            {...rest}
        >
            {alt && <span className="sr-only">{alt}</span>}
            <span className="m-auto notification-counter-number">{count ?? null}</span>
        </span>
    );
};

export default NotificationCounter;
