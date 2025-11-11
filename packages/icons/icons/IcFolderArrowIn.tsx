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

export const IcFolderArrowIn = ({
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
                    d="M7.793 9H1V8h6.793L6.646 6.854a.5.5 0 1 1 .708-.708l1.858 1.859a.7.7 0 0 1 0 .99l-1.858 1.859a.5.5 0 0 1-.708-.708L7.793 9Z"
                ></path>
                <path d="M3 2a2 2 0 0 0-2 2v3h1V4a1 1 0 0 1 1-1h2.528a1.5 1.5 0 0 1 .67.158l1.156.578A2.5 2.5 0 0 0 8.472 4H13a1 1 0 0 1 1 1v7a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1v-2H1v2a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2H8.472a1.5 1.5 0 0 1-.67-.158l-1.156-.578A2.5 2.5 0 0 0 5.528 2H3Z"></path>
            </svg>
            {alt ? <span className="sr-only">{alt}</span> : null}
        </>
    );
};
