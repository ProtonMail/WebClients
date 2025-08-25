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

export const IcLightbulb = ({ alt, title, size = 4, className = '', viewBox = '0 0 16 16', ...rest }: IconProps) => {
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

                <path
                    fillRule="evenodd"
                    d="M11.025 8.618a4 4 0 1 0-6.05 0c.53.611 1.127 1.416 1.389 2.382h3.272c.262-.966.859-1.77 1.389-2.382ZM5.5 12c0-1.033-.604-1.947-1.28-2.727a5 5 0 1 1 7.56 0c-.676.78-1.28 1.694-1.28 2.727v.5c0 .822-.303 1.464-.796 1.894C9.222 14.815 8.598 15 8 15c-.598 0-1.222-.185-1.704-.606-.493-.43-.796-1.072-.796-1.894V12Zm1 .5V12h3v.5c0 .559-.197.917-.454 1.141C8.778 13.875 8.402 14 8 14s-.778-.125-1.046-.359c-.257-.224-.454-.582-.454-1.141Zm-.5-7A1.5 1.5 0 0 1 7.5 4a.5.5 0 0 0 0-1A2.5 2.5 0 0 0 5 5.5a.5.5 0 0 0 1 0Z"
                ></path>
            </svg>
            {alt ? <span className="sr-only">{alt}</span> : null}
        </>
    );
};
