/*
 * This file is auto-generated. Do not modify it manually!
 * Run 'yarn workspace @proton/icons build' to update the icons react components.
 */
import React from 'react';

import type { IconSize } from '../types';

interface IconProps extends React.SVGProps<SVGSVGElement> {
    /** If specified, renders an sr-only element for screenreaders */
    alt?: string;
    /** If specified, renders an inline title element */
    title?: string;
    /**
     * The size of the icon
     * Refer to the sizing taxonomy: https://design-system.protontech.ch/?path=/docs/components-icon--basic#sizing
     */
    size?: IconSize;
}

export const IcMeetShieldFull = ({
    alt,
    title,
    size = 4,
    className = '',
    viewBox = '0 0 16 16',
    ...rest
}: IconProps) => {
    return (
        <>
            <svg
                viewBox={viewBox}
                className={`icon-size-${size} ${className}`}
                role="img"
                focusable="false"
                aria-hidden="true"
                {...rest}
            >
                {title ? <title>{title}</title> : null}

                <path d="M15.1893 3.12505C12.9739 2.87816 10.8987 1.91847 9.27592 0.390382C9.02588 0.140421 8.6868 0 8.33325 0C7.9797 0 7.64062 0.140421 7.39059 0.390382C5.76777 1.91847 3.69257 2.87816 1.47725 3.12505C1.15988 3.17058 0.869542 3.32894 0.659436 3.57113C0.449331 3.81331 0.33353 4.12309 0.333252 4.44372C0.333252 4.78905 0.418585 12.937 7.83725 15.9104C8.15587 16.0366 8.51063 16.0366 8.82925 15.9104C16.2479 12.933 16.3333 4.78905 16.3333 4.44372C16.333 4.12309 16.2172 3.81331 16.0071 3.57113C15.797 3.32894 15.5066 3.17058 15.1893 3.12505Z"></path>
            </svg>
            {alt ? <span className="sr-only">{alt}</span> : null}
        </>
    );
};
