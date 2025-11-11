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

export const IcEye = ({ alt, title, size = 4, className = '', viewBox = '0 0 16 16', ...rest }: IconProps) => {
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
                    d="M8 12c-2.186 0-4.476-1.26-5.987-4C3.523 5.26 5.814 4 8 4s4.476 1.26 5.987 4c-1.51 2.74-3.8 4-5.987 4Zm6.89-4.434c-3.32-6.088-10.46-6.088-13.78 0a.909.909 0 0 0 0 .868c3.32 6.088 10.46 6.088 13.78 0a.908.908 0 0 0 0-.868ZM8 6a2 2 0 0 1-2.989 1.739A3 3 0 1 0 7.74 5.01c.166.292.261.63.261.989Z"
                ></path>
            </svg>
            {alt ? <span className="sr-only">{alt}</span> : null}
        </>
    );
};
