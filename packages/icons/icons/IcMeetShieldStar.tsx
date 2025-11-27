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

export const IcMeetShieldStar = ({
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

                <path d="M8 4L9 6.1L11.3 6.4L9.7 8L10.1 10.3L8 9.3L5.9 10.3L6.3 8L4.7 6.4L7 6.1L8 4Z"></path>
                <path
                    d="M8 14.7C8 14.7 1.3 12 1.3 3.3L8 1.3L14.7 3.3C14.7 12 8 14.7 8 14.7Z"
                    stroke="currentColor"
                    strokeWidth="1.3"
                    strokeMiterlimit="10"
                    strokeLinecap="square"
                    fill="none"
                ></path>
            </svg>
            {alt ? <span className="sr-only">{alt}</span> : null}
        </>
    );
};
