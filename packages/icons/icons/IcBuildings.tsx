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

export const IcBuildings = ({ alt, title, size = 4, className = '', viewBox = '0 0 16 16', ...rest }: IconProps) => {
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
                    d="M8 3H2v11h2v-1.5a.5.5 0 0 1 .5-.5h1a.5.5 0 0 1 .5.5V14h2V3ZM1 15h14V9a1 1 0 0 0-1-1H9V3a1 1 0 0 0-1-1H2a1 1 0 0 0-1 1v12Zm13-1H9V9h5v5ZM3.3 4a.3.3 0 0 0-.3.3v.4a.3.3 0 0 0 .3.3h.4a.3.3 0 0 0 .3-.3v-.4a.3.3 0 0 0-.3-.3h-.4ZM3 6.3a.3.3 0 0 1 .3-.3h.4a.3.3 0 0 1 .3.3v.4a.3.3 0 0 1-.3.3h-.4a.3.3 0 0 1-.3-.3v-.4ZM3.3 8a.3.3 0 0 0-.3.3v.4a.3.3 0 0 0 .3.3h.4a.3.3 0 0 0 .3-.3v-.4a.3.3 0 0 0-.3-.3h-.4ZM3 10.3a.3.3 0 0 1 .3-.3h.4a.3.3 0 0 1 .3.3v.4a.3.3 0 0 1-.3.3h-.4a.3.3 0 0 1-.3-.3v-.4ZM6.3 4a.3.3 0 0 0-.3.3v.4a.3.3 0 0 0 .3.3h.4a.3.3 0 0 0 .3-.3v-.4a.3.3 0 0 0-.3-.3h-.4ZM6 6.3a.3.3 0 0 1 .3-.3h.4a.3.3 0 0 1 .3.3v.4a.3.3 0 0 1-.3.3h-.4a.3.3 0 0 1-.3-.3v-.4ZM6.3 8a.3.3 0 0 0-.3.3v.4a.3.3 0 0 0 .3.3h.4a.3.3 0 0 0 .3-.3v-.4a.3.3 0 0 0-.3-.3h-.4ZM6 10.3a.3.3 0 0 1 .3-.3h.4a.3.3 0 0 1 .3.3v.4a.3.3 0 0 1-.3.3h-.4a.3.3 0 0 1-.3-.3v-.4Zm4.3-.3a.3.3 0 0 0-.3.3v.4a.3.3 0 0 0 .3.3h.4a.3.3 0 0 0 .3-.3v-.4a.3.3 0 0 0-.3-.3h-.4Zm-.3 2.3a.3.3 0 0 1 .3-.3h.4a.3.3 0 0 1 .3.3v.4a.3.3 0 0 1-.3.3h-.4a.3.3 0 0 1-.3-.3v-.4Zm2.3-2.3a.3.3 0 0 0-.3.3v.4a.3.3 0 0 0 .3.3h.4a.3.3 0 0 0 .3-.3v-.4a.3.3 0 0 0-.3-.3h-.4Zm-.3 2.3a.3.3 0 0 1 .3-.3h.4a.3.3 0 0 1 .3.3v.4a.3.3 0 0 1-.3.3h-.4a.3.3 0 0 1-.3-.3v-.4Z"
                ></path>
            </svg>
            {alt ? <span className="sr-only">{alt}</span> : null}
        </>
    );
};
