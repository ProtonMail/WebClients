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

export const IcLinkPen = ({ alt, title, size = 4, className = '', viewBox = '0 0 16 16', ...rest }: IconProps) => {
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
                    d="M10.793 1.726a1 1 0 0 1 1.424-.01l.795.795a1 1 0 0 1 0 1.415L8.805 8.125a1 1 0 0 1-.591.285l-1.442.168a.5.5 0 0 1-.555-.552l.16-1.458a1 1 0 0 1 .277-.588l4.138-4.254Zm.717.698.795.794-4.206 4.199-.819.095.092-.835 4.138-4.253Z"
                ></path>
                <path d="M15 13a3 3 0 0 0-3-3H9.5a.5.5 0 1 0 0 1H12a2 2 0 1 1 0 4H9.5a.5.5 0 1 0 0 1H12a3 3 0 0 0 3-3Z"></path>
                <path d="M10.5 13a.5.5 0 0 1-.5.5H6a.5.5 0 0 1 0-1h4a.5.5 0 0 1 .5.5Z"></path>
                <path d="M1 13a3 3 0 0 0 3 3h2.5a.5.5 0 0 0 0-1H4a2 2 0 0 1 0-4h2.5a.5.5 0 0 0 0-1H4a3 3 0 0 0-3 3Z"></path>
            </svg>
            {alt ? <span className="sr-only">{alt}</span> : null}
        </>
    );
};
