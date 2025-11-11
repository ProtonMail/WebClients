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

export const IcBrandProtonSheets = ({
    alt,
    title,
    size = 4,
    className = '',
    viewBox = '0 0 16 16',
    ...rest
}: IconProps) => {
    return (
        <>
            {/* eslint-disable-next-line jsx-a11y/prefer-tag-over-role */}
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
                    clipRule="evenodd"
                    d="M4 2C2.89543 2 2 2.89543 2 4V12C2 13.1046 2.89543 14 4 14H12C13.1046 14 14 13.1046 14 12V8H11V5H8V2H4ZM9 2V4H11V2H9ZM12 2V4H14C14 2.89543 13.1046 2 12 2ZM14 5H12V7H14V5ZM1 4C1 2.34315 2.34315 1 4 1H12C13.6569 1 15 2.34315 15 4V12C15 13.6569 13.6569 15 12 15H4C2.34315 15 1 13.6569 1 12V4Z"
                ></path>
                <path d="M8.65501 9.99999C8.93115 9.99999 9.15501 10.2238 9.15501 10.5C9.15501 10.7761 8.93115 11 8.65501 11H3.65501C3.37886 11 3.15501 10.7761 3.15501 10.5C3.15501 10.2238 3.37886 9.99999 3.65501 9.99999H8.65501Z"></path>
                <path d="M5.83102 12.1283C5.83102 12.4044 5.60716 12.6283 5.33102 12.6283C5.05488 12.6283 4.83102 12.4044 4.83102 12.1283L4.83102 7.12827C4.83102 6.85212 5.05488 6.62827 5.33102 6.62827C5.60716 6.62827 5.83102 6.85212 5.83102 7.12827L5.83102 12.1283Z"></path>
            </svg>
            {alt ? <span className="sr-only">{alt}</span> : null}
        </>
    );
};
