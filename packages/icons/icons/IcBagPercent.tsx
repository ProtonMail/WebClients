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

export const IcBagPercent = ({ alt, title, size = 4, className = '', viewBox = '0 0 16 16', ...rest }: IconProps) => {
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
                    d="M8 1.5A2 2 0 0 0 6.063 3h3.874A2 2 0 0 0 8 1.5Zm0-1A3 3 0 0 0 5.041 3H2.5A1.5 1.5 0 0 0 1 4.5v7A3.5 3.5 0 0 0 4.5 15h7a3.5 3.5 0 0 0 3.5-3.5v-7A1.5 1.5 0 0 0 13.5 3h-2.541A3 3 0 0 0 8 .5ZM2.5 4h11a.5.5 0 0 1 .5.5v7a2.5 2.5 0 0 1-2.5 2.5h-7A2.5 2.5 0 0 1 2 11.5v-7a.5.5 0 0 1 .5-.5Zm3 3.5a.5.5 0 1 1 1 0 .5.5 0 0 1-1 0ZM6 6a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3Zm4.854.854a.5.5 0 0 0-.708-.708l-5 5a.5.5 0 0 0 .708.708l5-5ZM9.5 10.5a.5.5 0 1 1 1 0 .5.5 0 0 1-1 0ZM10 9a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3Z"
                ></path>
            </svg>
            {alt ? <span className="sr-only">{alt}</span> : null}
        </>
    );
};
