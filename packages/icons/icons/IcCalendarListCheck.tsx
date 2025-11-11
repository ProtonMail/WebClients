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

export const IcCalendarListCheck = ({
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

                <path d="M6.5 11a.5.5 0 0 1 0 1h-2a.5.5 0 0 1 0-1h2Zm5.435-1.854a.5.5 0 0 1 .707.708l-2 2a.5.5 0 0 1-.706 0l-.79-.789a.5.5 0 0 1 .708-.707l.434.435 1.647-1.647ZM6.5 9a.5.5 0 0 1 0 1h-2a.5.5 0 0 1 0-1h2Z"></path>
                <path
                    fillRule="evenodd"
                    d="M13 2a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2 .5.5 0 0 1 0 1 1 1 0 0 0-1 1v2h12V4a1 1 0 0 0-1-1 .5.5 0 0 1 0-1ZM2 13a1 1 0 0 0 1 1h10a1 1 0 0 0 1-1V7H2v6Z"
                    clipRule="evenodd"
                ></path>
                <path d="M4.5 1a.5.5 0 0 1 .5.5V3a.5.5 0 0 1-1 0V1.5a.5.5 0 0 1 .5-.5Zm7 0a.5.5 0 0 1 .5.5V3a.5.5 0 0 1-1 0V1.5a.5.5 0 0 1 .5-.5ZM10 2a.5.5 0 0 1 0 1H6a.5.5 0 0 1 0-1h4Z"></path>
            </svg>
            {alt ? <span className="sr-only">{alt}</span> : null}
        </>
    );
};
