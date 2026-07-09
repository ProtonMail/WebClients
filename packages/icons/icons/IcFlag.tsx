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

export const IcFlag = ({ alt, title, size = 4, className = '', viewBox = '0 0 16 16', ...rest }: IconProps) => {
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
                    fill="none"
                    fillRule="evenodd"
                    stroke="currentColor"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M2.667 14.666v-12a.67.67 0 0 1 .266-.533 4 4 0 0 1 2.4-.8c2 0 3.334 1.333 4.89 1.333q1.332 0 2.044-.533a.667.667 0 0 1 1.066.533v6.667a.67.67 0 0 1-.266.533 4 4 0 0 1-2.4.8c-2 0-3.334-1.333-5.334-1.333a4 4 0 0 0-2.666 1.019"
                ></path>
            </svg>
            {alt ? <span className="sr-only">{alt}</span> : null}
        </>
    );
};
