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

export const IcEyeSlash = ({ alt, title, size = 4, className = '', viewBox = '0 0 16 16', ...rest }: IconProps) => {
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
                    d="M2.146 2.146a.5.5 0 0 0 0 .708l11 11a.5.5 0 1 0 .707-.708l-1.599-1.6c1.007-.748 1.912-1.785 2.636-3.112a.908.908 0 0 0 0-.868C12.494 3.172 8.108 1.95 4.605 3.898L2.854 2.146a.5.5 0 0 0-.708 0Zm3.202 2.495 2.375 2.375A1.99 1.99 0 0 0 8 6c0-.36-.095-.697-.261-.989a3 3 0 0 1 2.707 4.727l1.088 1.09c.916-.654 1.757-1.59 2.439-2.828C12.46 5.254 10.173 4 8 4c-.885 0-1.79.208-2.652.64Zm.925 3.34a2.017 2.017 0 0 1-1.262-.242 3 3 0 0 0 4.076 3.058L6.273 7.98ZM1.11 7.566C1.69 6.506 2.383 5.63 3.153 4.94l.719.707C3.187 6.253 2.559 7.034 2.027 8c1.512 2.746 3.8 4 5.973 4 .655 0 1.32-.114 1.972-.349l.781.769c-3.382 1.472-7.391.143-9.643-3.986a.909.909 0 0 1 0-.868Z"
                ></path>
            </svg>
            {alt ? <span className="sr-only">{alt}</span> : null}
        </>
    );
};
