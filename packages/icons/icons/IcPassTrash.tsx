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

export const IcPassTrash = ({ alt, title, size = 4, className = '', viewBox = '0 0 16 16', ...rest }: IconProps) => {
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
                    d="M6.5 1C6.31061 1 6.13748 1.107 6.05279 1.27639L5.19098 3H2C1.72386 3 1.5 3.22386 1.5 3.5C1.5 3.77614 1.72386 4 2 4H3.02221L3.45713 13.5681C3.49354 14.3692 4.15364 15 4.95558 15H11.0444C11.8464 15 12.5065 14.3692 12.5429 13.5681L12.9778 4H14C14.2761 4 14.5 3.77614 14.5 3.5C14.5 3.22386 14.2761 3 14 3H10.809L9.94721 1.27639C9.86252 1.107 9.68939 1 9.5 1H6.5ZM9.69098 3L9.19098 2H6.80902L6.30902 3H9.69098ZM4.02324 4H11.9768L11.5439 13.5227C11.5318 13.7897 11.3117 14 11.0444 14H4.95558C4.68826 14 4.46823 13.7897 4.45609 13.5227L4.02324 4ZM7 6C7 5.72386 6.77614 5.5 6.5 5.5C6.22386 5.5 6 5.72386 6 6V12C6 12.2761 6.22386 12.5 6.5 12.5C6.77614 12.5 7 12.2761 7 12V6ZM10 6C10 5.72386 9.77614 5.5 9.5 5.5C9.22386 5.5 9 5.72386 9 6V12C9 12.2761 9.22386 12.5 9.5 12.5C9.77614 12.5 10 12.2761 10 12V6Z"
                ></path>
            </svg>
            {alt ? <span className="sr-only">{alt}</span> : null}
        </>
    );
};
