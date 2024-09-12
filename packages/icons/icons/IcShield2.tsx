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

export const IcShield2 = ({ alt, title, size = 4, className = '', viewBox = '0 0 16 16', ...rest }: IconProps) => {
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
                    d="M7.146 1.28a2.5 2.5 0 0 1 1.708 0l4.817 1.75A.5.5 0 0 1 14 3.5v5.626a4.5 4.5 0 0 1-2.345 3.95L8.239 14.94a.5.5 0 0 1-.478 0l-3.416-1.863A4.5 4.5 0 0 1 2 9.127V3.5a.5.5 0 0 1 .33-.47l4.816-1.752Zm1.367.94a1.5 1.5 0 0 0-1.026 0L3 3.85v5.275a3.5 3.5 0 0 0 1.824 3.073L8 13.93l3.176-1.732A3.5 3.5 0 0 0 13 9.126V3.851L8.513 2.219Z"
                ></path>
            </svg>
            {alt ? <span className="sr-only">{alt}</span> : null}
        </>
    );
};
