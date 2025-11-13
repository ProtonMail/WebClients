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

export const IcCalendarListFilled = ({
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
                    d="M15 13a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V7h14v6ZM4.5 11a.5.5 0 0 0 0 1h5a.5.5 0 0 0 0-1h-5Zm0-2a.5.5 0 0 0 0 1h7a.5.5 0 0 0 0-1h-7Z"
                    clipRule="evenodd"
                ></path>
                <path d="M3.5 3a1 1 0 0 0 2 0V2h5v1a1 1 0 1 0 2 0V2h.5a2 2 0 0 1 2 2v2H1V4a2 2 0 0 1 2-2h.5v1Z"></path>
                <path d="M4.5 1a.5.5 0 0 1 .5.5V3a.5.5 0 0 1-1 0V1.5a.5.5 0 0 1 .5-.5Zm7 0a.5.5 0 0 1 .5.5V3a.5.5 0 0 1-1 0V1.5a.5.5 0 0 1 .5-.5Z"></path>
            </svg>
            {alt ? <span className="sr-only">{alt}</span> : null}
        </>
    );
};
