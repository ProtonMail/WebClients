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

export const IcMinusCircle = ({ alt, title, size = 4, className = '', viewBox = '0 0 16 16', ...rest }: IconProps) => {
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

                <path d="M6 8a.5.5 0 0 0 0 1h5a.5.5 0 0 0 0-1H6Z"></path>
                <path
                    fillRule="evenodd"
                    d="M8.5 1a7.5 7.5 0 1 0 0 15 7.5 7.5 0 0 0 0-15ZM2 8.5a6.5 6.5 0 1 1 13 0 6.5 6.5 0 0 1-13 0Z"
                ></path>
            </svg>
            {alt ? <span className="sr-only">{alt}</span> : null}
        </>
    );
};
