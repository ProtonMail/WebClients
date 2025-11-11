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

export const IcKeySkeleton = ({ alt, title, size = 4, className = '', viewBox = '0 0 16 16', ...rest }: IconProps) => {
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
                    d="M13 4.414a2.414 2.414 0 1 1-4.829 0 2.414 2.414 0 0 1 4.829 0Zm1 0A3.414 3.414 0 0 1 8.554 7.16l-3.832 3.89 1.373 1.373a.5.5 0 1 1-.707.707l-1.37-1.37L3 12.775l1.37 1.37a.5.5 0 1 1-.706.708l-1.371-1.371a1 1 0 0 1 0-1.414l1.37-1.37 4.183-4.246A3.414 3.414 0 1 1 14 4.414Z"
                ></path>
            </svg>
            {alt ? <span className="sr-only">{alt}</span> : null}
        </>
    );
};
