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

export const IcGrid3 = ({ alt, title, size = 4, className = '', viewBox = '0 0 16 16', ...rest }: IconProps) => {
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
                    d="M2 2.8a.8.8 0 0 1 .8-.8h.4a.8.8 0 0 1 .8.8v.4a.8.8 0 0 1-.8.8h-.4a.8.8 0 0 1-.8-.8v-.4Zm0 5a.8.8 0 0 1 .8-.8h.4a.8.8 0 0 1 .8.8v.4a.8.8 0 0 1-.8.8h-.4a.8.8 0 0 1-.8-.8v-.4Zm.8 4.2a.8.8 0 0 0-.8.8v.4a.8.8 0 0 0 .8.8h.4a.8.8 0 0 0 .8-.8v-.4a.8.8 0 0 0-.8-.8h-.4ZM7 2.8a.8.8 0 0 1 .8-.8h.4a.8.8 0 0 1 .8.8v.4a.8.8 0 0 1-.8.8h-.4a.8.8 0 0 1-.8-.8v-.4ZM7.8 7a.8.8 0 0 0-.8.8v.4a.8.8 0 0 0 .8.8h.4a.8.8 0 0 0 .8-.8v-.4a.8.8 0 0 0-.8-.8h-.4ZM7 12.8a.8.8 0 0 1 .8-.8h.4a.8.8 0 0 1 .8.8v.4a.8.8 0 0 1-.8.8h-.4a.8.8 0 0 1-.8-.8v-.4ZM12.8 2a.8.8 0 0 0-.8.8v.4a.8.8 0 0 0 .8.8h.4a.8.8 0 0 0 .8-.8v-.4a.8.8 0 0 0-.8-.8h-.4ZM12 7.8a.8.8 0 0 1 .8-.8h.4a.8.8 0 0 1 .8.8v.4a.8.8 0 0 1-.8.8h-.4a.8.8 0 0 1-.8-.8v-.4Zm.8 4.2a.8.8 0 0 0-.8.8v.4a.8.8 0 0 0 .8.8h.4a.8.8 0 0 0 .8-.8v-.4a.8.8 0 0 0-.8-.8h-.4Z"
                ></path>
            </svg>
            {alt ? <span className="sr-only">{alt}</span> : null}
        </>
    );
};
