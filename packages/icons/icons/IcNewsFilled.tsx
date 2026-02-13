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

export const IcNewsFilled = ({ alt, title, size = 4, className = '', viewBox = '0 0 16 16', ...rest }: IconProps) => {
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
                    d="M13 1a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H2a2 2 0 0 0 2-2V3a2 2 0 0 1 2-2h7ZM6.5 8a.5.5 0 0 0-.5.5v2a.5.5 0 0 0 .5.5h2a.5.5 0 0 0 .5-.5v-2a.5.5 0 0 0-.5-.5h-2Zm4 2a.5.5 0 0 0 0 1h2a.5.5 0 0 0 0-1h-2Zm0-2a.5.5 0 0 0 0 1h2a.5.5 0 0 0 0-1h-2Zm-4-2a.5.5 0 0 0 0 1h6a.5.5 0 0 0 0-1h-6Zm0-2a.5.5 0 0 0 0 1h6a.5.5 0 0 0 0-1h-6Z"
                    clipRule="evenodd"
                ></path>
                <path d="M3 13a1 1 0 1 1-2 0V8a1 1 0 0 1 1-1h1v6Z"></path>
            </svg>
            {alt ? <span className="sr-only">{alt}</span> : null}
        </>
    );
};
