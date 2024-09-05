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

export const IcBrandPaypal = ({ alt, title, size = 4, className = '', viewBox = '0 0 16 16', ...rest }: IconProps) => {
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
                    d="M12.525 3.496A3.503 3.503 0 0 0 9.15 1H3.744a1.167 1.167 0 0 0-1.167.992L1.024 12.49a1.166 1.166 0 0 0 1.167 1.4h2.335c-.005.286.095.564.28.782.234.226.552.344.876.326h3.422l.583-3.5h.643c2.579 0 4.67-2.088 4.67-4.665a3.5 3.5 0 0 0-2.475-3.337ZM11.52 4.5c0 1.932-1.568 3.5-3.502 3.5H6.336l.397-3.5h4.788ZM5.578 4.37l-.934 8.294H2.191L3.744 2.167H9.15a2.336 2.336 0 0 1 2.044 1.166h-4.46a1.167 1.167 0 0 0-1.157 1.038Zm4.752 5.961H8.695l-.584 3.5H5.682l.526-4.666H7.97a4.669 4.669 0 0 0 4.67-4.351 2.333 2.333 0 0 1 1.215 2.018 3.497 3.497 0 0 1-3.527 3.5Z"
                ></path>
            </svg>
            {alt ? <span className="sr-only">{alt}</span> : null}
        </>
    );
};
