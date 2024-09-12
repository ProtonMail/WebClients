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

export const IcMapPin = ({ alt, title, size = 4, className = '', viewBox = '0 0 16 16', ...rest }: IconProps) => {
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
                    d="M8 2C5.783 2 4 3.78 4 5.96c0 1.107.314 2.193.906 3.133l2.929 4.648A11.062 11.062 0 0 0 8 14l.012-.018c.034-.05.078-.12.153-.24l2.929-4.648c.592-.94.906-2.026.906-3.133C12 3.78 10.217 2 8 2ZM4.06 9.626A6.877 6.877 0 0 1 3 5.96C3 3.22 5.239 1 8 1s5 2.22 5 4.96a6.877 6.877 0 0 1-1.06 3.666l-2.929 4.648c-.143.228-.215.342-.282.413a1.006 1.006 0 0 1-1.458 0c-.067-.07-.139-.185-.282-.413L4.06 9.626Z"
                ></path>
                <path fillRule="evenodd" d="M8 7a1 1 0 1 0 0-2 1 1 0 0 0 0 2Zm0 1a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z"></path>
            </svg>
            {alt ? <span className="sr-only">{alt}</span> : null}
        </>
    );
};
