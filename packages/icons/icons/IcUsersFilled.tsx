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

export const IcUsersFilled = ({ alt, title, size = 4, className = '', viewBox = '0 0 16 16', ...rest }: IconProps) => {
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
                    d="M8 5.5a2.5 2.5 0 1 1-5 0 2.5 2.5 0 0 1 5 0ZM3.624 9a1.98 1.98 0 0 0-1.682.94l-.76 1.224c-.495.8.075 1.836 1.01 1.836h6.616c.935 0 1.505-1.037 1.01-1.836l-.76-1.224A1.98 1.98 0 0 0 7.376 9H3.624Zm9.976.8 1.2 1.6A1 1 0 0 1 14 13h-3v-1.333a2 2 0 0 0-.4-1.2L9.5 9H12a2 2 0 0 1 1.6.8ZM11 8a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z"
                ></path>
            </svg>
            {alt ? <span className="sr-only">{alt}</span> : null}
        </>
    );
};
