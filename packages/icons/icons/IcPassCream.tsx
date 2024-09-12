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

export const IcPassCream = ({ alt, title, size = 4, className = '', viewBox = '0 0 16 16', ...rest }: IconProps) => {
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

                <path d="M11.5114 7C11.5034 6.99982 11.4953 6.99983 11.4873 7.00004H4.5127"></path>
                <path
                    fillRule="evenodd"
                    clipRule="evenodd"
                    d="M8 -0.00463867C7.0384 -0.00463867 6.10926 0.343244 5.38412 0.974786C4.76291 1.51581 4.32734 2.23372 4.13222 3.02723C3.60524 3.1056 3.1135 3.35101 2.73223 3.73228C2.26339 4.20112 2 4.837 2 5.50004C2 6.16308 2.26339 6.79897 2.73223 7.26781C3.12092 7.6565 3.62443 7.90398 4.16303 7.97724L7.54192 15.7004C7.62154 15.8824 7.80135 16 8 16C8.19865 16 8.37846 15.8824 8.45808 15.7004L11.837 7.97724C12.3756 7.90398 12.8791 7.6565 13.2678 7.26781C13.7366 6.79897 14 6.16308 14 5.50004C14 4.837 13.7366 4.20112 13.2678 3.73228C12.8865 3.351 12.3948 3.1056 11.8678 3.02723C11.6727 2.23372 11.2371 1.51581 10.6159 0.974786C9.89074 0.343244 8.9616 -0.00463867 8 -0.00463867ZM5.26453 8.00004H10.7355L8 14.2526L5.26453 8.00004ZM4.48857 7C4.09488 6.997 3.71795 6.83931 3.43934 6.5607C3.15804 6.2794 3 5.89787 3 5.50004C3 5.10222 3.15804 4.72069 3.43934 4.43938C3.72064 4.15808 4.10218 4.00004 4.5 4.00004H4.55C4.79961 4.00004 5.01098 3.81595 5.04526 3.56871C5.14416 2.85536 5.4978 2.20187 6.04088 1.72889C6.58396 1.2559 7.27983 0.995361 8 0.995361C8.72017 0.995361 9.41604 1.2559 9.95912 1.72889C10.5022 2.20187 10.8558 2.85536 10.9547 3.56871C10.989 3.81595 11.2004 4.00004 11.45 4.00004H11.4994C11.8972 4.00004 12.2794 4.15808 12.5607 4.43938C12.842 4.72069 13 5.10222 13 5.50004C13 5.89787 12.842 6.2794 12.5607 6.5607C12.282 6.83931 11.9051 6.997 11.5114 7"
                ></path>
            </svg>
            {alt ? <span className="sr-only">{alt}</span> : null}
        </>
    );
};
