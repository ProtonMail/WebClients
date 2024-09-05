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

export const IcBriefcase = ({ alt, title, size = 4, className = '', viewBox = '0 0 16 16', ...rest }: IconProps) => {
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
                    d="M7 2a1 1 0 0 0-1 1h4a1 1 0 0 0-1-1H7Zm0-1a2 2 0 0 0-2 2H3a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2h-2a2 2 0 0 0-2-2H7ZM6 4h7a1 1 0 0 1 1 1v1a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a1 1 0 0 1 1-1h3Zm0 5H4c-.768 0-1.47-.289-2-.764V13a1 1 0 0 0 1 1h10a1 1 0 0 0 1-1V8.236A2.989 2.989 0 0 1 12 9h-2a1.5 1.5 0 0 1-1.5 1.5h-1A1.5 1.5 0 0 1 6 9Zm3 0H7a.5.5 0 0 0 .5.5h1A.5.5 0 0 0 9 9Z"
                ></path>
            </svg>
            {alt ? <span className="sr-only">{alt}</span> : null}
        </>
    );
};
