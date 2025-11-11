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

export const IcBolt = ({ alt, title, size = 4, className = '', viewBox = '0 0 16 16', ...rest }: IconProps) => {
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
                    d="M5.765 15.441a.5.5 0 0 1-.247-.573L6.845 10H3.5a.5.5 0 0 1-.378-.827l6.5-7.5a.5.5 0 0 1 .86.459L9.155 7H12.5a.5.5 0 0 1 .378.827l-6.5 7.5a.5.5 0 0 1-.613.114ZM11.405 8H8.5a.5.5 0 0 1-.482-.632l.922-3.381L4.595 9H7.5a.5.5 0 0 1 .482.632l-.922 3.381L11.405 8Z"
                ></path>
            </svg>
            {alt ? <span className="sr-only">{alt}</span> : null}
        </>
    );
};
