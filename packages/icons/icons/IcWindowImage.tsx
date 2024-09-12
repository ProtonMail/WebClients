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

export const IcWindowImage = ({ alt, title, size = 4, className = '', viewBox = '0 0 16 16', ...rest }: IconProps) => {
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
                    d="M3 3h10a1 1 0 0 1 1 1H2a1 1 0 0 1 1-1ZM1 5V4a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V5Zm1 0h12v7a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V5Zm9.557 7c.361 0 .57-.387.358-.663L9.433 8.104a.275.275 0 0 0-.43 0L7.2 10.455 6.195 9.148a.275.275 0 0 0-.43 0l-1.68 2.19c-.212.275-.003.662.358.662h7.114ZM6.8 8a.8.8 0 1 0 0-1.6.8.8 0 0 0 0 1.6Z"
                ></path>
            </svg>
            {alt ? <span className="sr-only">{alt}</span> : null}
        </>
    );
};
