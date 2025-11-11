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

export const IcLifeRing = ({ alt, title, size = 4, className = '', viewBox = '0 0 16 16', ...rest }: IconProps) => {
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
                    d="M11.874 12.582A5.976 5.976 0 0 1 8 14a5.976 5.976 0 0 1-3.874-1.418l2.136-2.137c.49.35 1.09.555 1.738.555.648 0 1.248-.205 1.738-.555l2.136 2.136ZM6.596 9.425a.537.537 0 0 0-.02-.021 2 2 0 1 1 2.85 0l-.012.01-.01.01A1.994 1.994 0 0 1 8 10c-.547 0-1.043-.22-1.404-.575Zm-1.041.313-2.137 2.136A5.976 5.976 0 0 1 2 8c0-1.477.533-2.829 1.418-3.874l2.136 2.136C5.205 6.752 5 7.352 5 8c0 .648.205 1.248.555 1.738Zm7.027 2.136A5.976 5.976 0 0 0 14 8a5.976 5.976 0 0 0-1.418-3.874l-2.136 2.136c.349.49.554 1.09.554 1.738 0 .648-.205 1.248-.555 1.738l2.136 2.136Zm-2.843-6.32 2.136-2.135A5.976 5.976 0 0 0 8 2c-1.477 0-2.83.534-3.875 1.419l2.136 2.136C6.751 5.205 7.352 5 8 5c.648 0 1.248.205 1.739.555ZM8 1a6.978 6.978 0 0 1 4.964 2.064A7 7 0 1 1 8 1Z"
                ></path>
            </svg>
            {alt ? <span className="sr-only">{alt}</span> : null}
        </>
    );
};
