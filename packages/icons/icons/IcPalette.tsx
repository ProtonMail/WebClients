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

export const IcPalette = ({ alt, title, size = 4, className = '', viewBox = '0 0 16 16', ...rest }: IconProps) => {
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
                    d="M1.5 8a6.5 6.5 0 1 1 12.963.701c-.059.544-.579.97-1.258.97H8.701c-1.796 0-2.682 2.186-1.392 3.436l.824.799c.144.14.165.307.13.42a.24.24 0 0 1-.083.123.3.3 0 0 1-.18.051A6.5 6.5 0 0 1 1.5 8M8 .5a7.5 7.5 0 1 0 0 15 1.24 1.24 0 0 0 1.217-.874 1.42 1.42 0 0 0-.388-1.438l-.824-.799c-.645-.625-.202-1.717.696-1.717h4.504c1.053 0 2.126-.686 2.252-1.864Q15.5 8.41 15.5 8A7.5 7.5 0 0 0 8 .5M9.5 4a1 1 0 1 1-2 0 1 1 0 0 1 2 0M5 6.5a1 1 0 1 0 0-2 1 1 0 0 0 0 2M4 10a1 1 0 1 0 0-2 1 1 0 0 0 0 2m7.5-3.5a1 1 0 1 0 0-2 1 1 0 0 0 0 2"
                ></path>
            </svg>
            {alt ? <span className="sr-only">{alt}</span> : null}
        </>
    );
};
