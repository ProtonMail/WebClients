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

export const IcArrowInToRectangle = ({
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
                    d="M7 1h6a2 2 0 0 1 2 2v11a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2v-1h1v1a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V3a1 1 0 0 0-1-1H7a1 1 0 0 0-1 1v1H5V3a2 2 0 0 1 2-2Zm-.354 4.646a.5.5 0 0 1 .708 0l2.358 2.359a.7.7 0 0 1 0 .99l-2.358 2.359a.5.5 0 0 1-.708-.708L8.293 9H1.5a.5.5 0 0 1 0-1h6.793L6.646 6.354a.5.5 0 0 1 0-.708Z"
                ></path>
            </svg>
            {alt ? <span className="sr-only">{alt}</span> : null}
        </>
    );
};
