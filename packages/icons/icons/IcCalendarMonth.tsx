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

export const IcCalendarMonth = ({
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

                <path
                    fillRule="evenodd"
                    d="M10.5 1a.5.5 0 0 1 .5.5V6h3V4a1 1 0 0 0-1-1h-1a.5.5 0 0 1 0-1h1a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h1a.5.5 0 0 1 0 1H3a1 1 0 0 0-1 1v2h3V1.5a.5.5 0 0 1 1 0V6h4V1.5a.5.5 0 0 1 .5-.5ZM2 13a1 1 0 0 0 1 1h2v-3H2v2Zm4 1h4v-3H6v3Zm5 0h2a1 1 0 0 0 1-1v-2h-3v3Zm-9-4h3V7H2v3Zm4 0h4V7H6v3Zm5 0h3V7h-3v3Z"
                    clipRule="evenodd"
                ></path>
                <path d="M9 2a.5.5 0 0 1 0 1H7a.5.5 0 0 1 0-1h2Z"></path>
            </svg>
            {alt ? <span className="sr-only">{alt}</span> : null}
        </>
    );
};
