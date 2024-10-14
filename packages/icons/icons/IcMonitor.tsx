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

export const IcMonitor = ({ alt, title, size = 4, className = '', viewBox = '0 0 16 16', ...rest }: IconProps) => {
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

                <path d="M3.5 1A2.5 2.5 0 0 0 1 3.5v9A2.5 2.5 0 0 0 3.5 15H7a.5.5 0 0 0 0-1H3.5A1.5 1.5 0 0 1 2 12.5v-9A1.5 1.5 0 0 1 3.5 2h9A1.5 1.5 0 0 1 14 3.5V7a.5.5 0 0 0 1 0V3.5A2.5 2.5 0 0 0 12.5 1h-9Z"></path>
                <path d="M4 4.5a.5.5 0 0 1 .5-.5h7a.5.5 0 0 1 0 1h-7a.5.5 0 0 1-.5-.5Z"></path>
                <path
                    fillRule="evenodd"
                    d="M13.596 14.303a3.5 3.5 0 1 1 .707-.707l1.45 1.45a.5.5 0 1 1-.707.708l-1.45-1.45ZM14 11.5a2.5 2.5 0 1 1-5 0 2.5 2.5 0 0 1 5 0Z"
                ></path>
                <path d="M4.5 8h3a.5.5 0 0 0 0-1h-3a.5.5 0 0 0 0 1ZM4 10.5a.5.5 0 0 1 .5-.5h1a.5.5 0 0 1 0 1h-1a.5.5 0 0 1-.5-.5Z"></path>
            </svg>
            {alt ? <span className="sr-only">{alt}</span> : null}
        </>
    );
};
