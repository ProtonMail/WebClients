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

export const IcCalendarLock = ({ alt, title, size = 4, className = '', viewBox = '0 0 16 16', ...rest }: IconProps) => {
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

                <path d="M13 2a2 2 0 0 1 2 2v4a.5.5 0 0 1-1 0V7H2v6a1 1 0 0 0 1 1h4.5a.5.5 0 0 1 0 1H3a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2 .5.5 0 0 1 0 1 1 1 0 0 0-1 1v2h12V4a1 1 0 0 0-1-1 .5.5 0 0 1 0-1"></path>
                <path
                    fillRule="evenodd"
                    d="M12 8a2 2 0 0 1 2 2v.024c.57.116 1 .621 1 1.226v2.5c0 .69-.56 1.25-1.25 1.25h-3.5C9.56 15 9 14.44 9 13.75v-2.5c0-.605.43-1.11 1-1.226V10a2 2 0 0 1 2-2m0 .75c-.69 0-1.25.56-1.25 1.25h2.5c0-.69-.56-1.25-1.25-1.25"
                ></path>
                <path d="M4.5 1a.5.5 0 0 1 .5.5V3a.5.5 0 0 1-1 0V1.5a.5.5 0 0 1 .5-.5m7 0a.5.5 0 0 1 .5.5V3a.5.5 0 0 1-1 0V1.5a.5.5 0 0 1 .5-.5M10 2a.5.5 0 0 1 0 1H6a.5.5 0 0 1 0-1z"></path>
            </svg>
            {alt ? <span className="sr-only">{alt}</span> : null}
        </>
    );
};
