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

export const IcSquaresPlus = ({ alt, title, size = 4, className = '', viewBox = '0 0 16 16', ...rest }: IconProps) => {
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
                    d="M6.81819 1C5.81403 1 5 1.81403 5 2.81819V4.00001H6V2.81819C6 2.36632 6.36632 2 6.81819 2H13C13.5523 2 14 2.44772 14 3V9C14 9.55229 13.5523 10 13 10H12V11H13C14.1046 11 15 10.1046 15 9V3C15 1.89543 14.1046 1 13 1H6.81819ZM2 7C2 6.44772 2.44772 6 3 6H9C9.55229 6 10 6.44772 10 7V13C10 13.5523 9.55229 14 9 14H3C2.44772 14 2 13.5523 2 13V7ZM1 7C1 5.89543 1.89543 5 3 5H9C10.1046 5 11 5.89543 11 7V13C11 14.1046 10.1046 15 9 15H3C1.89543 15 1 14.1046 1 13V7Z"
                ></path>
                <path d="M6.5 12.5C6.5 12.7761 6.27614 13 6 13C5.72386 13 5.5 12.7761 5.5 12.5V7.5C5.5 7.22386 5.72386 7 6 7C6.27614 7 6.5 7.22386 6.5 7.5V12.5Z"></path>
                <path d="M8.5 9.5C8.77614 9.5 9 9.72386 9 10C9 10.2761 8.77614 10.5 8.5 10.5H3.5C3.22386 10.5 3 10.2761 3 10C3 9.72386 3.22386 9.5 3.5 9.5H8.5Z"></path>
            </svg>
            {alt ? <span className="sr-only">{alt}</span> : null}
        </>
    );
};
