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

export const IcListNumbers = ({ alt, title, size = 4, className = '', viewBox = '0 0 16 16', ...rest }: IconProps) => {
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
                    d="M1.026 3.5a.5.5 0 0 1 .5-.5h.998a.5.5 0 0 1 .5.5V6h.498a.5.5 0 0 1 0 1H1.526a.5.5 0 0 1 0-1h.498V4h-.498a.5.5 0 0 1-.5-.5Zm4.49 1a.5.5 0 0 1 .5-.5h7.485a.5.5 0 0 1 0 1H6.017a.5.5 0 0 1-.5-.5ZM13.502 9H6.017a.5.5 0 1 1 0-1H13.5a.5.5 0 0 1 0 1Zm-7.484 3a.5.5 0 0 0 0 1H13.5a.5.5 0 0 0 0-1H6.017ZM2.04 9.863a.342.342 0 0 1 .567-.134.345.345 0 0 1 .025.459l-.005.006-.004.006-1.497 1.995a.5.5 0 0 0 .4.8h1.996a.5.5 0 0 0 0-1h-.996l.893-1.19c.421-.534.377-1.3-.104-1.783a1.342 1.342 0 0 0-2.223.526l-.068.204a.5.5 0 0 0 .949.316l.067-.205Z"
                ></path>
            </svg>
            {alt ? <span className="sr-only">{alt}</span> : null}
        </>
    );
};
