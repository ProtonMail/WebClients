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

export const IcMailbox = ({ alt, title, size = 4, className = '', viewBox = '0 0 16 16', ...rest }: IconProps) => {
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
                    d="M4.5 2A4.5 4.5 0 0 0 0 6.5v6.9a.6.6 0 0 0 .6.6h14.8a.6.6 0 0 0 .6-.6V6.5A4.5 4.5 0 0 0 11.5 2h-7Zm2.829 1H11.5A3.5 3.5 0 0 1 15 6.5V13H9V6.5A4.491 4.491 0 0 0 7.329 3ZM8 13V6.5a3.5 3.5 0 1 0-7 0V13h7ZM2.5 6a.5.5 0 0 0 0 1H6a.5.5 0 0 0 0-1H2.5Z"
                ></path>
                <path
                    fillRule="evenodd"
                    d="M10 6.5a.5.5 0 0 1 .5-.5h3a.5.5 0 0 1 .5.5v2a.5.5 0 0 1-.5.5h-1a.5.5 0 0 1 0-1h.5V7h-2.5a.5.5 0 0 1-.5-.5Z"
                ></path>
            </svg>
            {alt ? <span className="sr-only">{alt}</span> : null}
        </>
    );
};
