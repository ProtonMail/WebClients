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

export const IcSortAlphabetically = ({
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
                    d="M11.5 1a.5.5 0 0 1 .5.5v11.793l2.146-2.147a.5.5 0 0 1 .708.708l-3 3a.5.5 0 0 1-.708 0l-3-3a.5.5 0 0 1 .708-.708L11 13.293V1.5a.5.5 0 0 1 .5-.5ZM4 2a1 1 0 0 0-1 1v1h2V3a1 1 0 0 0-1-1Zm1 3v1.5a.5.5 0 0 0 1 0V3a2 2 0 1 0-4 0v3.5a.5.5 0 0 0 1 0V5h2ZM2 8.5a.5.5 0 0 1 .5-.5h2.625a.875.875 0 0 1 .7 1.4l-2.7 3.6H5.5a.5.5 0 0 1 0 1H2.875a.875.875 0 0 1-.7-1.4l2.7-3.6H2.5a.5.5 0 0 1-.5-.5Z"
                ></path>
            </svg>
            {alt ? <span className="sr-only">{alt}</span> : null}
        </>
    );
};
