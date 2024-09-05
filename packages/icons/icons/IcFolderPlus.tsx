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

export const IcFolderPlus = ({ alt, title, size = 4, className = '', viewBox = '0 0 16 16', ...rest }: IconProps) => {
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
                    d="M1 4.05a2 2 0 0 1 2-2h2.528c.388 0 .77.09 1.118.264l1.155.578a1.5 1.5 0 0 0 .671.158H14a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2v-8Zm2-1a1 1 0 0 0-1 1v8a1 1 0 0 0 1 1h11a1 1 0 0 0 1-1v-7a1 1 0 0 0-1-1H8.472a2.5 2.5 0 0 1-1.118-.264L6.2 3.208a1.5 1.5 0 0 0-.671-.158H3Z"
                ></path>
                <path
                    fillRule="evenodd"
                    d="M8.5 6a.5.5 0 0 1 .5.5V8h1.5a.5.5 0 0 1 0 1H9v1.5a.5.5 0 0 1-1 0V9H6.5a.5.5 0 0 1 0-1H8V6.5a.5.5 0 0 1 .5-.5Z"
                ></path>
            </svg>
            {alt ? <span className="sr-only">{alt}</span> : null}
        </>
    );
};
