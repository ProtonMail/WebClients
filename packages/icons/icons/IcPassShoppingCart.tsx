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

export const IcPassShoppingCart = ({
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
                    clipRule="evenodd"
                    d="M0.5 0C0.223858 0 0 0.223858 0 0.5C0 0.776142 0.223858 1 0.5 1H2V9C2 10.1041 2.89586 11 4 11H14.5C14.7761 11 15 10.7761 15 10.5C15 10.2239 14.7761 10 14.5 10H4C3.44814 10 3 9.55186 3 9V8H12.5C12.7045 8 12.8883 7.87552 12.9642 7.6857L14.9642 2.6857C15.0259 2.53165 15.007 2.35707 14.914 2.21969C14.821 2.0823 14.6659 2 14.5 2H3V0.5C3 0.223858 2.77614 0 2.5 0H0.5ZM3 3V7H12.1615L13.7615 3H3Z"
                ></path>
                <path
                    fillRule="evenodd"
                    clipRule="evenodd"
                    d="M4 12C2.89543 12 2 12.8954 2 14C2 15.1046 2.89543 16 4 16C5.10457 16 6 15.1046 6 14C6 12.8954 5.10457 12 4 12ZM3 14C3 13.4477 3.44772 13 4 13C4.55228 13 5 13.4477 5 14C5 14.5523 4.55228 15 4 15C3.44772 15 3 14.5523 3 14Z"
                ></path>
                <path
                    fillRule="evenodd"
                    clipRule="evenodd"
                    d="M11 14C11 12.8954 11.8954 12 13 12C14.1046 12 15 12.8954 15 14C15 15.1046 14.1046 16 13 16C11.8954 16 11 15.1046 11 14ZM13 13C12.4477 13 12 13.4477 12 14C12 14.5523 12.4477 15 13 15C13.5523 15 14 14.5523 14 14C14 13.4477 13.5523 13 13 13Z"
                ></path>
            </svg>
            {alt ? <span className="sr-only">{alt}</span> : null}
        </>
    );
};
