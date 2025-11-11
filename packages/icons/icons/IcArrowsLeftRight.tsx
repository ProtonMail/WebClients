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

export const IcArrowsLeftRight = ({
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

                <path d="M4.353 6.352 2.655 7.996H13.35l-1.697-1.644a.493.493 0 0 1-.006-.703.508.508 0 0 1 .711-.007L14.789 8a.69.69 0 0 1 0 .993l-2.432 2.358a.508.508 0 0 1-.711-.007.493.493 0 0 1 .006-.703l1.697-1.645H2.655l1.698 1.645a.492.492 0 0 1 .007.703.508.508 0 0 1-.712.007L1.215 8.993a.69.69 0 0 1 0-.993l2.433-2.358a.508.508 0 0 1 .712.007.493.493 0 0 1-.007.703Z"></path>
            </svg>
            {alt ? <span className="sr-only">{alt}</span> : null}
        </>
    );
};
