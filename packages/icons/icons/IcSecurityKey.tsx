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

export const IcSecurityKey = ({ alt, title, size = 4, className = '', viewBox = '0 0 16 16', ...rest }: IconProps) => {
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
                    d="M4 2.5C4 1.67157 4.67157 1 5.5 1H10.5C11.3284 1 12 1.67157 12 2.5V10.5C12 11.3284 11.3284 12 10.5 12H10V13.5C10 14.3284 9.32843 15 8.5 15H7.5C6.67157 15 6 14.3284 6 13.5V12H5.5C4.67157 12 4 11.3284 4 10.5V2.5ZM10.5 11C10.7761 11 11 10.7761 11 10.5V2.5C11 2.22386 10.7761 2 10.5 2H5.5C5.22386 2 5 2.22386 5 2.5V10.5C5 10.7761 5.22386 11 5.5 11H10.5ZM7 12V13.5C7 13.7761 7.22386 14 7.5 14H8.5C8.77614 14 9 13.7761 9 13.5V12H7ZM8 5.5C7.44772 5.5 7 5.94772 7 6.5C7 7.05228 7.44772 7.5 8 7.5C8.55228 7.5 9 7.05228 9 6.5C9 5.94772 8.55228 5.5 8 5.5ZM6 6.5C6 5.39543 6.89543 4.5 8 4.5C9.10457 4.5 10 5.39543 10 6.5C10 7.60457 9.10457 8.5 8 8.5C6.89543 8.5 6 7.60457 6 6.5Z"
                    clipRule="evenodd"
                ></path>
            </svg>
            {alt ? <span className="sr-only">{alt}</span> : null}
        </>
    );
};
