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

export const IcArrowsCross = ({ alt, title, size = 4, className = '', viewBox = '0 0 16 16', ...rest }: IconProps) => {
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

                <path d="M10.294 4.418 9 3.124V8h4.876l-1.294-1.293a.5.5 0 0 1 .707-.708l2.006 2.006a.7.7 0 0 1 0 .99l-2.006 2.006a.5.5 0 0 1-.707-.707L13.875 9H9v4.876l1.294-1.294a.5.5 0 0 1 .707.707l-2.006 2.006a.7.7 0 0 1-.99 0L5.999 13.29a.5.5 0 1 1 .707-.708L8 13.876V9H3.124l1.294 1.294a.5.5 0 1 1-.707.707L1.705 8.995a.7.7 0 0 1 0-.99L3.711 6a.5.5 0 0 1 .707.708L3.124 8H8V3.124L6.706 4.418A.5.5 0 0 1 6 3.71l2.006-2.006a.7.7 0 0 1 .99 0L11 3.711a.5.5 0 0 1-.707.707Z"></path>
            </svg>
            {alt ? <span className="sr-only">{alt}</span> : null}
        </>
    );
};
