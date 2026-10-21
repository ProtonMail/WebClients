/*
 * This file is auto-generated. Do not modify it manually!
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

export const IcQuestionCircle = ({
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

                <path
                    fillRule="evenodd"
                    d="M8 14A6 6 0 1 0 8 2a6 6 0 0 0 0 12m0 1A7 7 0 1 0 8 1a7 7 0 0 0 0 14m-.5-3.5A.5.5 0 0 1 8 11h.01a.5.5 0 0 1 0 1H8a.5.5 0 0 1-.5-.5m-1-4.852a1.5 1.5 0 0 1 1.5-1.5h.148c.747 0 1.352.606 1.352 1.352 0 .25-.118.487-.319.637l-.681.511a2.5 2.5 0 0 0-1 2 .5.5 0 0 0 1 0 1.5 1.5 0 0 1 .6-1.2l.681-.51c.453-.34.719-.872.719-1.438a2.35 2.35 0 0 0-2.352-2.352H8a2.5 2.5 0 0 0-2.5 2.5.5.5 0 0 0 1 0"
                ></path>
            </svg>
            {alt ? <span className="sr-only">{alt}</span> : null}
        </>
    );
};
