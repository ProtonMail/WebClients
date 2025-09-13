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

export const IcMeetConnectionIndicator = ({
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
                    d="M8 14C8.82843 14 9.5 13.3284 9.5 12.5C9.5 11.6716 8.82843 11 8 11C7.17157 11 6.5 11.6716 6.5 12.5C6.5 13.3284 7.17157 14 8 14Z"
                    fill="currentColor"
                ></path>
                <path
                    d="M11.5 10C10.6 9 9.3 8.5 8 8.5C6.7 8.5 5.4 9 4.5 10L3.1 8.6C4.4 7.2 6.1 6.5 8 6.5C9.9 6.5 11.6 7.2 12.9 8.6L11.5 10Z"
                    fill="currentColor"
                ></path>
                <path
                    d="M8 2C5 2 2.2 3.1 0 5.2L1.4 6.6C3.2 4.9 5.5 4 8 4C10.5 4 12.8 4.9 14.6 6.7L16 5.2C13.8 3.1 11 2 8 2Z"
                    fill="currentColor"
                ></path>
            </svg>
            {alt ? <span className="sr-only">{alt}</span> : null}
        </>
    );
};
