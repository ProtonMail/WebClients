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

export const IcMeetRecord = ({ alt, title, size = 4, className = '', viewBox = '0 0 16 16', ...rest }: IconProps) => {
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
                    d="M14.6667 8C14.6666 4.31825 11.6815 1.33398 7.99976 1.33398C4.31812 1.33416 1.33392 4.31836 1.33374 8C1.33374 11.6818 4.31801 14.6668 7.99976 14.667C11.6817 14.667 14.6667 11.6819 14.6667 8ZM15.9998 8C15.9998 12.4183 12.418 16 7.99976 16C3.58163 15.9998 -0.000244141 12.4182 -0.000244141 8C-6.81109e-05 3.58198 3.58174 0.000176026 7.99976 0C12.4179 0 15.9996 3.58187 15.9998 8Z"
                    fill="currentColor"
                ></path>
                <path
                    d="M11.3334 8.00033C11.3334 9.84127 9.84103 11.3337 8.00008 11.3337C6.15913 11.3337 4.66675 9.84127 4.66675 8.00033C4.66675 6.15938 6.15913 4.66699 8.00008 4.66699C9.84103 4.66699 11.3334 6.15938 11.3334 8.00033Z"
                    fill="currentColor"
                ></path>
            </svg>
            {alt ? <span className="sr-only">{alt}</span> : null}
        </>
    );
};
