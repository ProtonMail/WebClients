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

export const IcMegaphoneFilled = ({
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
                    fillRule="evenodd"
                    d="M5.83 11a1.5 1.5 0 0 1 1.454 1.137l.405 1.62A1 1 0 0 1 6.72 15h-.1a1 1 0 0 1-.895-.553L4 11h1.83Zm7.61-9.547c.681-.402 1.56.088 1.56.879v9.55c0 .743-.785 1.235-1.46.924C11.324 11.785 7.142 10 5 10V5c2.11 0 6.2-2.226 8.44-3.547ZM4 10H3a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h1v5Z"
                ></path>
            </svg>
            {alt ? <span className="sr-only">{alt}</span> : null}
        </>
    );
};
