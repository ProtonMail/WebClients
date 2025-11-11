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

export const IcArrowsRotate = ({ alt, title, size = 4, className = '', viewBox = '0 0 16 16', ...rest }: IconProps) => {
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

                <path d="M11.316 4.254A5.005 5.005 0 0 0 3.002 7.84a.5.5 0 0 1-1-.032 5.977 5.977 0 0 1 1.755-4.05 6.005 6.005 0 0 1 8.28-.2V2.555a.5.5 0 0 1 1 0v2a.7.7 0 0 1-.7.7h-2.001a.5.5 0 0 1 0-1h.98Z"></path>
                <path d="M14.004 7.938a.5.5 0 0 0-1 .01 5.005 5.005 0 0 1-8.317 3.794h.848a.5.5 0 0 0 0-1H3.534a.7.7 0 0 0-.7.7v2a.5.5 0 0 0 1 0v-1.127a6.005 6.005 0 0 0 8.412-.075 5.98 5.98 0 0 0 1.758-4.302Z"></path>
            </svg>
            {alt ? <span className="sr-only">{alt}</span> : null}
        </>
    );
};
