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

export const IcArrowDownArrowUp = ({
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
                    d="M10.984 2.206a.699.699 0 0 1 .992 0l1.98 1.99a.5.5 0 1 1-.71.705l-1.264-1.27.018 9.848a.5.5 0 1 1-1 .002l-.018-9.855L9.713 4.9a.5.5 0 1 1-.709-.705l1.98-1.99ZM4.5 2.08a.5.5 0 0 1 .5.5v9.793l1.267-1.273a.5.5 0 1 1 .709.705l-1.98 1.99a.699.699 0 0 1-.992 0l-1.98-1.99a.5.5 0 1 1 .71-.705L4 12.372V2.579a.5.5 0 0 1 .5-.5Z"
                ></path>
            </svg>
            {alt ? <span className="sr-only">{alt}</span> : null}
        </>
    );
};
