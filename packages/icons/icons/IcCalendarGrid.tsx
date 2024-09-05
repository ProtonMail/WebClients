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

export const IcCalendarGrid = ({ alt, title, size = 4, className = '', viewBox = '0 0 16 16', ...rest }: IconProps) => {
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
                    d="M3 1.5v.67A3.001 3.001 0 0 0 1 5v7a3 3 0 0 0 3 3h8a3 3 0 0 0 3-3V5a3.001 3.001 0 0 0-2-2.83V1.5a.5.5 0 0 0-1 0V2H4v-.5a.5.5 0 0 0-1 0ZM4 3h8a2 2 0 0 1 2 2H2a2 2 0 0 1 2-2Zm6 3H6v2h4V6Zm0 3H6v2h4V9Zm1 2V9h3v2h-3Zm-1 1H6v2h4v-2Zm1 2v-2h3a2 2 0 0 1-2 2h-1Zm0-6V6h3v2h-3ZM2 6h3v2H2V6Zm0 3h3v2H2V9Zm0 3h3v2H4a2 2 0 0 1-2-2Z"
                ></path>
            </svg>
            {alt ? <span className="sr-only">{alt}</span> : null}
        </>
    );
};
