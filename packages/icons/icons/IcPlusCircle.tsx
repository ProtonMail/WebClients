/*
 * This file is auto-generated. Do not modify it manually!
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

export const IcPlusCircle = ({ alt, title, size = 4, className = '', viewBox = '0 0 16 16', ...rest }: IconProps) => {
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
                    d="M12.035 8a.5.5 0 0 1-.5.5H8.5v3.036a.5.5 0 1 1-1 0V8.5H4.464a.5.5 0 0 1 0-1H7.5V4.465a.5.5 0 1 1 1 0V7.5h3.035a.5.5 0 0 1 .5.5M8 14A6 6 0 1 0 8 2a6 6 0 0 0 0 12m0 1A7 7 0 1 0 8 1a7 7 0 0 0 0 14"
                ></path>
            </svg>
            {alt ? <span className="sr-only">{alt}</span> : null}
        </>
    );
};
