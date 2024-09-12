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

                <path d="M7 6.648a1.5 1.5 0 0 1 1.5-1.5h.148C9.395 5.148 10 5.754 10 6.5c0 .25-.118.487-.319.637L9 7.648a2.5 2.5 0 0 0-1 2 .5.5 0 0 0 1 0 1.5 1.5 0 0 1 .6-1.2l.681-.51c.453-.34.719-.872.719-1.438a2.352 2.352 0 0 0-2.352-2.352H8.5a2.5 2.5 0 0 0-2.5 2.5.5.5 0 0 0 1 0Z"></path>
                <path d="M8.5 12.75a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5Z"></path>
                <path
                    fillRule="evenodd"
                    d="M1 8.5a7.5 7.5 0 1 1 15 0 7.5 7.5 0 0 1-15 0ZM8.5 2a6.5 6.5 0 1 0 0 13 6.5 6.5 0 0 0 0-13Z"
                ></path>
            </svg>
            {alt ? <span className="sr-only">{alt}</span> : null}
        </>
    );
};
