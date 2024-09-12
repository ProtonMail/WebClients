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

export const IcArrowLeftAndDown = ({
    alt,
    title,
    size = 4,
    className = '',
    viewBox = '0 0 16 16',
    ...rest
}: IconProps) => {
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

                <path d="M1 10.5C1 10.6326 1.05268 10.7598 1.14645 10.8536L5.14645 14.8536C5.34171 15.0488 5.65829 15.0488 5.85355 14.8536C6.04882 14.6583 6.04882 14.3417 5.85355 14.1464L2.70711 11L13.5 11C14.3284 11 15 10.3284 15 9.5L15 3.5C15 2.67157 14.3284 2 13.5 2L11.5 2C11.2239 2 11 2.22386 11 2.5C11 2.77614 11.2239 3 11.5 3L13.5 3C13.7761 3 14 3.22386 14 3.5L14 9.5C14 9.77614 13.7761 10 13.5 10L2.70711 10L5.85355 6.85355C6.04882 6.65829 6.04882 6.34171 5.85355 6.14645C5.65829 5.95118 5.34171 5.95118 5.14645 6.14645L1.14645 10.1464C1.05268 10.2402 1 10.3674 1 10.5Z"></path>
            </svg>
            {alt ? <span className="sr-only">{alt}</span> : null}
        </>
    );
};
