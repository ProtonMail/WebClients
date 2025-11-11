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

export const IcBrandBitcoin = ({ alt, title, size = 4, className = '', viewBox = '0 0 16 16', ...rest }: IconProps) => {
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
                    d="M8 14A6 6 0 1 0 8 2a6 6 0 0 0 0 12Zm0 1A7 7 0 1 0 8 1a7 7 0 0 0 0 14Z"
                ></path>
                <path
                    fillRule="evenodd"
                    d="M8 3.25a.5.5 0 0 1 .5.5V4H9a2 2 0 0 1 1.4 3.428A2.5 2.5 0 0 1 9 12h-.5v.25a.5.5 0 0 1-1 0V12h-2a.5.5 0 0 1 0-1H6V5h-.5a.5.5 0 0 1 0-1h2v-.25a.5.5 0 0 1 .5-.5ZM7 5v2h2a1 1 0 0 0 0-2H7Zm0 3v3h2a1.5 1.5 0 0 0 0-3H7Z"
                ></path>
            </svg>
            {alt ? <span className="sr-only">{alt}</span> : null}
        </>
    );
};
