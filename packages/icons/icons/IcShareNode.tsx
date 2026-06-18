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

export const IcShareNode = ({ alt, title, size = 4, className = '', viewBox = '0 0 16 16', ...rest }: IconProps) => {
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

                <circle
                    cx="2.5"
                    cy="2.5"
                    r="2"
                    stroke="currentColor"
                    fill="none"
                    transform="matrix(-1 0 0 1 15 5.5)"
                ></circle>
                <circle
                    cx="2.5"
                    cy="2.5"
                    r="2"
                    stroke="currentColor"
                    fill="none"
                    transform="matrix(-1 0 0 1 7 1)"
                ></circle>
                <circle
                    cx="2.5"
                    cy="2.5"
                    r="2"
                    stroke="currentColor"
                    fill="none"
                    transform="matrix(-1 0 0 1 7 10)"
                ></circle>
                <path stroke="currentColor" d="M11 7 6 4.5M10.5 9l-4 2.5"></path>
            </svg>
            {alt ? <span className="sr-only">{alt}</span> : null}
        </>
    );
};
