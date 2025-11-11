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

export const IcFoldersFilled = ({
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

                <path d="M3.11 2.5A1.5 1.5 0 0 1 4.61 1h3.536a1.5 1.5 0 0 1 .67.158l1.642.821a.2.2 0 0 0 .09.021H14.5A1.5 1.5 0 0 1 16 3.5v8a1.5 1.5 0 0 1-1.5 1.5H4.61a1.5 1.5 0 0 1-1.5-1.5v-9Z"></path>
                <path d="M2 4a1 1 0 0 0-1 1v7.5A2.5 2.5 0 0 0 3.5 15H13a1 1 0 0 0 1-1H3.5A1.5 1.5 0 0 1 2 12.5V4Z"></path>
            </svg>
            {alt ? <span className="sr-only">{alt}</span> : null}
        </>
    );
};
