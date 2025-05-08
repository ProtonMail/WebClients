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

export const IcCloudArrowDown = ({
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
                    clipRule="evenodd"
                    d="M9.88808 6L9.59927 5.50073C9.07904 4.60141 8.10917 4 7 4C5.34315 4 4 5.34315 4 7V7.87788L3.33325 8.11355C2.5551 8.38858 2 9.13075 2 10C2 11.1046 2.89543 12 4 12H11C12.6569 12 14 10.6569 14 9C14 7.34315 12.6569 6 11 6H9.88808ZM10.4649 5H11C13.2091 5 15 6.79086 15 9C15 11.2091 13.2091 13 11 13H4C2.34315 13 1 11.6569 1 10C1 8.69378 1.83481 7.58254 3 7.17071V7C3 4.79086 4.79086 3 7 3C8.48057 3 9.77325 3.8044 10.4649 5Z"
                ></path>
                <path d="M8.49498 10.8536C8.22161 11.1269 7.77839 11.1269 7.50503 10.8536L6.14645 9.49499C5.95118 9.29973 5.95118 8.98315 6.14645 8.78788C6.34171 8.59262 6.65829 8.59262 6.85355 8.78788L7.5 9.43433V6.5C7.5 6.22386 7.72386 6 8 6C8.27614 6 8.5 6.22386 8.5 6.5V9.43433L9.14645 8.78788C9.34171 8.59262 9.65829 8.59262 9.85355 8.78788C10.0488 8.98314 10.0488 9.29973 9.85355 9.49499L8.49498 10.8536Z"></path>
            </svg>
            {alt ? <span className="sr-only">{alt}</span> : null}
        </>
    );
};
