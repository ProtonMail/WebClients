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

export const IcTextQuoteFilled = ({
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

                <path d="M4 4C2.34315 4 1 5.34315 1 7C1 8.32522 1.85927 9.44975 3.05106 9.84682L2 13H4L6.6 8.5H6.59865C6.85391 8.05874 7 7.54643 7 7C7 5.34315 5.65685 4 4 4Z"></path>
                <path d="M9 7C9 5.34315 10.3431 4 12 4C13.6569 4 15 5.34315 15 7C15 7.54643 14.8539 8.05874 14.5987 8.5H14.6L12 13H10L11.0511 9.84682C9.85927 9.44975 9 8.32522 9 7Z"></path>
            </svg>
            {alt ? <span className="sr-only">{alt}</span> : null}
        </>
    );
};
