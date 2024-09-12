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

export const IcFolderArrowUp = ({
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

                <path d="M1 4a2 2 0 0 1 2-2h3.028c.388 0 .77.09 1.118.264l1.155.578A1.5 1.5 0 0 0 8.972 3H13a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2h-3v-1h3a1 1 0 0 0 1-1V5a1 1 0 0 0-1-1H8.972a2.5 2.5 0 0 1-1.118-.264L6.7 3.158A1.5 1.5 0 0 0 6.028 3H3a1 1 0 0 0-1 1v8a1 1 0 0 0 1 1h4v1H3a2 2 0 0 1-2-2V4Z"></path>
                <path d="M8.854 6.646a.5.5 0 0 0-.708 0l-2 2a.5.5 0 1 0 .708.708L8 8.207V14h1V8.207l1.146 1.147a.5.5 0 0 0 .708-.708l-2-2Z"></path>
            </svg>
            {alt ? <span className="sr-only">{alt}</span> : null}
        </>
    );
};
