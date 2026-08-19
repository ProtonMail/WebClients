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

export const IcTextSize = ({ alt, title, size = 4, className = '', viewBox = '0 0 16 16', ...rest }: IconProps) => {
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

                <path d="M14 3.5V3H11V13H12C12.2761 13 12.5 13.2239 12.5 13.5C12.5 13.7761 12.2761 14 12 14H9C8.72386 14 8.5 13.7761 8.5 13.5C8.5 13.2239 8.72386 13 9 13H10V3H7V3.5C7 3.77614 6.77614 4 6.5 4C6.22386 4 6 3.77614 6 3.5V2H15V3.5C15 3.77614 14.7761 4 14.5 4C14.2239 4 14 3.77614 14 3.5Z"></path>
                <path d="M7 7.5V7H5V13H5.5C5.77614 13 6 13.2239 6 13.5C6 13.7761 5.77614 14 5.5 14H3.5C3.22386 14 3 13.7761 3 13.5C3 13.2239 3.22386 13 3.5 13H4V7H2V7.5C2 7.77614 1.77614 8 1.5 8C1.22386 8 1 7.77614 1 7.5V6H8V7.5C8 7.77614 7.77614 8 7.5 8C7.22386 8 7 7.77614 7 7.5Z"></path>
            </svg>
            {alt ? <span className="sr-only">{alt}</span> : null}
        </>
    );
};
