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

export const IcInfinite = ({ alt, title, size = 4, className = '', viewBox = '0 0 16 16', ...rest }: IconProps) => {
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
                    clipRule="evenodd"
                    d="M1 8C1 6.37006 2.25596 5 3.8634 5C4.74101 5 5.5774 5.36911 6.32025 5.8653C6.92093 6.26654 7.48777 6.76929 8 7.28221C8.51223 6.76929 9.07907 6.26654 9.67975 5.8653C10.4226 5.36911 11.259 5 12.1366 5C13.744 5 15 6.37006 15 8C15 9.62994 13.744 11 12.1366 11C11.259 11 10.4226 10.6309 9.67975 10.1347C9.07907 9.73346 8.51223 9.23071 8 8.71779C7.48777 9.23071 6.92093 9.73346 6.32025 10.1347C5.5774 10.6309 4.74101 11 3.8634 11C2.25596 11 1 9.62994 1 8ZM7.30352 8C6.81683 7.51173 6.29793 7.05296 5.7648 6.69685C5.1043 6.25566 4.46345 6 3.8634 6C2.86044 6 2 6.86866 2 8C2 9.13134 2.86044 10 3.8634 10C4.46345 10 5.1043 9.74434 5.7648 9.30315C6.29793 8.94704 6.81683 8.48827 7.30352 8ZM8.69648 8C9.18317 8.48827 9.70207 8.94704 10.2352 9.30315C10.8957 9.74434 11.5365 10 12.1366 10C13.1396 10 14 9.13134 14 8C14 6.86866 13.1396 6 12.1366 6C11.5365 6 10.8957 6.25566 10.2352 6.69685C9.70207 7.05296 9.18317 7.51173 8.69648 8Z"
                ></path>
            </svg>
            {alt ? <span className="sr-only">{alt}</span> : null}
        </>
    );
};
