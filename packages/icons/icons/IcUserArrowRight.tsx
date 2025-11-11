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

export const IcUserArrowRight = ({
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
                    d="M8 7a2 2 0 1 0 0-4 2 2 0 0 0 0 4Zm0 1a3 3 0 1 0 0-6 3 3 0 0 0 0 6Zm-2.497 2a1.5 1.5 0 0 0-1.2.6l-1.2 1.6a.5.5 0 0 0 .4.8H9v1H3.503c-1.236 0-1.942-1.411-1.2-2.4l1.2-1.6a2.5 2.5 0 0 1 2-1H9v1H5.503Zm6.694 3.85a.5.5 0 0 0 .708.006L14.79 12a.7.7 0 0 0 0-.998l-1.886-1.857a.5.5 0 0 0-.702.712L13.364 11H9.508a.5.5 0 0 0 0 1h3.856l-1.161 1.144a.5.5 0 0 0-.006.707Z"
                ></path>
            </svg>
            {alt ? <span className="sr-only">{alt}</span> : null}
        </>
    );
};
