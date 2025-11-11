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

export const IcInfoCircle = ({ alt, title, size = 4, className = '', viewBox = '0 0 16 16', ...rest }: IconProps) => {
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

                <path d="M7.25 7.5a.5.5 0 0 1 .5-.5H9v4h.5a.5.5 0 0 1 0 1h-2a.5.5 0 0 1 0-1H8V8h-.25a.5.5 0 0 1-.5-.5ZM8.4 6.3a.9.9 0 1 0 0-1.8.9.9 0 0 0 0 1.8Z"></path>
                <path
                    fillRule="evenodd"
                    d="M1 8.5a7.5 7.5 0 1 1 15 0 7.5 7.5 0 0 1-15 0ZM8.5 2a6.5 6.5 0 1 0 0 13 6.5 6.5 0 0 0 0-13Z"
                    clipRule="evenodd"
                ></path>
            </svg>
            {alt ? <span className="sr-only">{alt}</span> : null}
        </>
    );
};
