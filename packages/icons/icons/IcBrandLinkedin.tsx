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

export const IcBrandLinkedin = ({
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
                    d="M13.444 1C14.304 1 15 1.697 15 2.556v10.888c0 .86-.697 1.556-1.556 1.556H2.556C1.696 15 1 14.303 1 13.444V2.556C1 1.696 1.697 1 2.556 1zM3.146 13.056h2.087V6.314H3.146zm7.456-6.948c-1.43 0-2.033 1.115-2.033 1.115v-.909H6.567v6.742H8.57v-3.54c0-.947.438-1.511 1.273-1.511.767 0 1.136.542 1.136 1.512v3.539h2.078V8.788c0-1.806-1.024-2.68-2.453-2.68M4.18 2.944a1.24 1.24 0 0 0-1.235 1.244A1.24 1.24 0 0 0 4.18 5.433a1.24 1.24 0 0 0 1.234-1.245A1.24 1.24 0 0 0 4.18 2.944"
                ></path>
            </svg>
            {alt ? <span className="sr-only">{alt}</span> : null}
        </>
    );
};
