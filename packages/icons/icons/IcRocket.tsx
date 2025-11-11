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

export const IcRocket = ({ alt, title, size = 4, className = '', viewBox = '0 0 16 16', ...rest }: IconProps) => {
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
                    d="M7 9a1.5 1.5 0 1 1 3 0 1.5 1.5 0 0 1-3 0Zm1.5-.5a.5.5 0 1 0 0 1 .5.5 0 0 0 0-1Z"
                ></path>
                <path
                    fillRule="evenodd"
                    d="M9.07 1.29a.957.957 0 0 0-1.14 0C5.12 3.378 5.004 6.776 5 9.55A2.5 2.5 0 0 0 3 12v2h11v-2a2.5 2.5 0 0 0-2-2.45c-.005-2.775-.121-6.173-2.93-8.26ZM4 12a1.5 1.5 0 0 1 1-1.415V13H4v-1Zm2 1v-3c0-1.35.007-2.726.25-4h4.5c.243 1.274.25 2.65.25 4v3H6Zm4.5-8h-4c.356-1.112.963-2.108 2-2.888 1.037.78 1.644 1.776 2 2.888Zm2.5 8h-1v-2.415A1.5 1.5 0 0 1 13 12v1Z"
                ></path>
                <path d="M5.5 15a.5.5 0 0 0 0 1h6a.5.5 0 0 0 0-1h-6Z"></path>
            </svg>
            {alt ? <span className="sr-only">{alt}</span> : null}
        </>
    );
};
