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

export const IcBackspace = ({ alt, title, size = 4, className = '', viewBox = '0 0 16 16', ...rest }: IconProps) => {
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
                    d="M5.518 2a2.5 2.5 0 0 0-2.021 1.03L.096 7.706a.5.5 0 0 0 0 .588l3.4 4.676A2.5 2.5 0 0 0 5.519 14H15.5a.5.5 0 0 0 .5-.5v-11a.5.5 0 0 0-.5-.5H5.518ZM4.305 3.618A1.5 1.5 0 0 1 5.518 3H15v10H5.518a1.5 1.5 0 0 1-1.213-.618L1.118 8l3.187-4.382Zm3.549 2.028a.5.5 0 1 0-.708.708L8.793 8 7.146 9.646a.5.5 0 0 0 .708.708L9.5 8.707l1.646 1.647a.5.5 0 0 0 .708-.708L10.207 8l1.647-1.646a.5.5 0 0 0-.708-.708L9.5 7.293 7.854 5.646Z"
                ></path>
            </svg>
            {alt ? <span className="sr-only">{alt}</span> : null}
        </>
    );
};
