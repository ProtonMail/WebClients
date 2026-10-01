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

export const IcNews = ({ alt, title, size = 4, className = '', viewBox = '0 0 16 16', ...rest }: IconProps) => {
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

                <path d="M8.5 8a.5.5 0 0 1 .5.5v2a.5.5 0 0 1-.5.5h-2a.5.5 0 0 1-.5-.5v-2a.5.5 0 0 1 .5-.5h2Zm4 2a.5.5 0 0 1 0 1h-2a.5.5 0 0 1 0-1h2Zm0-2a.5.5 0 0 1 0 1h-2a.5.5 0 0 1 0-1h2Zm0-2a.5.5 0 0 1 0 1h-6a.5.5 0 0 1 0-1h6Zm0-2a.5.5 0 0 1 0 1h-6a.5.5 0 0 1 0-1h6Z"></path>
                <path
                    fillRule="evenodd"
                    d="M13 1a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h1V3a2 2 0 0 1 2-2h7ZM3 7a1 1 0 0 0-1 1v5l.005.102A1 1 0 0 0 4 13V7H3Zm3-5a1 1 0 0 0-1 1v10c0 .351-.063.687-.174 1H13a1 1 0 0 0 1-1V3a1 1 0 0 0-1-1H6Z"
                    clipRule="evenodd"
                ></path>
            </svg>
            {alt ? <span className="sr-only">{alt}</span> : null}
        </>
    );
};
