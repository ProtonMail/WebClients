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

export const IcBrandEdge = ({ alt, title, size = 4, className = '', viewBox = '0 0 16 16', ...rest }: IconProps) => {
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

                <path d="M9.297 9.277c-.06.055-.149.136-.149.273 0 .144.093.288.263.405.766.543 2.205.479 2.267.476h.002a3.23 3.23 0 0 0 1.657-.46 3.38 3.38 0 0 0 1.216-1.24A3.434 3.434 0 0 0 15 7.04c.015-1.165-.385-1.964-.583-2.36l-.035-.07C13.217 2.318 10.718 1 8 1c-1.84 0-3.605.733-4.915 2.04A7.132 7.132 0 0 0 1 7.99c.027-2.022 2.012-3.655 4.375-3.655.191 0 1.285.016 2.297.554.71.357 1.299.922 1.69 1.622.333.587.393 1.335.393 1.634 0 .299-.147.736-.426 1.102l.005-.006-.037.037Z"></path>
                <path d="M7.148 6.54c-.576.288-1.083.7-1.485 1.207a4.524 4.524 0 0 0-.124 5.436 4.35 4.35 0 0 0 1.242 1.18h.005a4.104 4.104 0 0 0 1.67.604 4.08 4.08 0 0 0 1.759-.161l.07-.022a7.032 7.032 0 0 0 3.643-2.924.224.224 0 0 0-.029-.267.218.218 0 0 0-.261-.043 5.51 5.51 0 0 1-2.543.615c-2.587 0-4.84-1.8-4.84-4.115.004-.31.089-.614.246-.88a1.73 1.73 0 0 1 .647-.63Z"></path>
                <path d="M5.375 4.84c-2.04 0-3.64 1.311-3.851 2.844a2.76 2.76 0 0 0-.018.31V8c-.01.995.2 1.98.615 2.883a6.538 6.538 0 0 0 3.738 3.414 4.867 4.867 0 0 1-.725-.816 5.036 5.036 0 0 1-.802-4.12 5 5 0 0 1 .941-1.93 4.925 4.925 0 0 1 1.658-1.346l.01-.004.022-.011a2.293 2.293 0 0 1 1.197-.252 3.467 3.467 0 0 0-.71-.476l-.01-.005c-.901-.478-1.894-.496-2.065-.496Z"></path>
            </svg>
            {alt ? <span className="sr-only">{alt}</span> : null}
        </>
    );
};
