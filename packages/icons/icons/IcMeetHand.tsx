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

export const IcMeetHand = ({ alt, title, size = 4, className = '', viewBox = '0 0 16 16', ...rest }: IconProps) => {
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
                    d="M7.5,3.5V3A1.5,1.5,0,0,0,6,1.5H6A1.5,1.5,0,0,0,4.5,3V9.5L2.179,8.587a1.209,1.209,0,0,0-1.3.268h0A1.209,1.209,0,0,0,.82,10.505l2.619,2.9a6.136,6.136,0,0,0,4.618,2.1H9.364A6.136,6.136,0,0,0,15.5,9.364V3.5a1,1,0,0,0-1-1h0a1,1,0,0,0-1,1v1"
                    fill="none"
                    stroke="currentColor"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                ></path>
                <path
                    d="M10.5,3.5V3A1.5,1.5,0,0,1,12,1.5h0A1.5,1.5,0,0,1,13.5,3V6.5"
                    fill="none"
                    stroke="currentColor"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                ></path>
                <path
                    d="M7.5,6.5V2A1.5,1.5,0,0,1,9,.5H9A1.5,1.5,0,0,1,10.5,2V6.5"
                    fill="none"
                    stroke="currentColor"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                ></path>
            </svg>
            {alt ? <span className="sr-only">{alt}</span> : null}
        </>
    );
};
