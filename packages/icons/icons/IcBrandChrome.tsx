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

export const IcBrandChrome = ({ alt, title, size = 4, className = '', viewBox = '0 0 16 16', ...rest }: IconProps) => {
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

                <path d="M4.875 1.735A7.015 7.015 0 0 0 2.514 3.64l2.363 4.093a3.134 3.134 0 0 1 3.077-2.838h6.329a7.02 7.02 0 0 0-9.409-3.16Z"></path>
                <path d="M10.586 8.027a2.569 2.569 0 1 1-5.138 0 2.569 2.569 0 0 1 5.138 0Z"></path>
                <path d="M9.733 5.459h4.796a7.017 7.017 0 0 1-6.992 9.527l3.071-5.319c.03-.049.06-.099.087-.15l.027-.046h-.002a3.131 3.131 0 0 0-.987-4.012Z"></path>
                <path d="M5.21 9.436a3.135 3.135 0 0 0 4.08 1.386l-2.365 4.096A7.014 7.014 0 0 1 2.151 4.14L5.21 9.435Z"></path>
            </svg>
            {alt ? <span className="sr-only">{alt}</span> : null}
        </>
    );
};
