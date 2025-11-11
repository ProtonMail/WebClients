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

export const IcArrowsFromCenter = ({
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

                <path d="M14 2.724V6.5a.5.5 0 1 1-1 0V3.703L3.707 13H6.5a.5.5 0 0 1 0 1H2.724c-.047 0-.118 0-.18-.007a.606.606 0 0 1-.368-.168.606.606 0 0 1-.17-.369 1.678 1.678 0 0 1-.006-.18V9.5a.5.5 0 0 1 1 0v2.793L12.289 3H9.5a.5.5 0 0 1 0-1h3.776c.047 0 .118 0 .18.007.063.007.23.03.368.169a.606.606 0 0 1 .17.368c.006.062.006.132.006.18Z"></path>
            </svg>
            {alt ? <span className="sr-only">{alt}</span> : null}
        </>
    );
};
