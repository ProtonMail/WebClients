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

export const IcSliders = ({ alt, title, size = 4, className = '', viewBox = '0 0 16 16', ...rest }: IconProps) => {
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
                    d="M12.9371 2.5C12.7151 1.63672 11.932 1 11 1C10.068 1 9.28485 1.63672 9.06293 2.5H1.5C1.32916 2.5 1.17831 2.58594 1.08813 2.7168C1.03256 2.79688 1 2.89453 1 3C1 3.27539 1.22385 3.5 1.5 3.5H9.06293C9.28485 4.36328 10.068 5 11 5C11.932 5 12.7151 4.36328 12.9371 3.5H14.5C14.7762 3.5 15 3.27539 15 3C15 2.72461 14.7762 2.5 14.5 2.5H12.9371ZM12 3C12 3.55273 11.5523 4 11 4C10.4477 4 10 3.55273 10 3C10 2.44727 10.4477 2 11 2C11.5523 2 12 2.44727 12 3Z"
                ></path>
                <path
                    fillRule="evenodd"
                    d="M1.5 12.5C1.22385 12.5 1 12.7246 1 13C1 13.2129 1.13367 13.3945 1.32181 13.4668C1.37717 13.4883 1.43723 13.5 1.5 13.5H9.06293C9.28485 14.3633 10.068 15 11 15C11.932 15 12.7151 14.3633 12.9371 13.5H14.5C14.7762 13.5 15 13.2754 15 13C15 12.7246 14.7762 12.5 14.5 12.5H12.9371C12.7151 11.6367 11.932 11 11 11C10.068 11 9.28485 11.6367 9.06293 12.5H1.5ZM11 12C11.5523 12 12 12.4473 12 13C12 13.5527 11.5523 14 11 14C10.4477 14 10 13.5527 10 13C10 12.4473 10.4477 12 11 12Z"
                ></path>
                <path
                    fillRule="evenodd"
                    d="M3.06293 7.5H1.5C1.34 7.5 1.19754 7.57617 1.10602 7.69336C1.05502 7.75781 1.01987 7.83594 1.00626 7.92188L1 8C1 8.11133 1.03638 8.21289 1.0979 8.29688C1.1749 8.40039 1.29126 8.47461 1.42499 8.49414L1.5 8.5H3.06293C3.28485 9.36328 4.06796 10 5 10C5.93204 10 6.71515 9.36328 6.93707 8.5H14.5C14.5811 8.5 14.6578 8.48047 14.7255 8.44531L14.7667 8.42188C14.7903 8.4082 14.8127 8.39258 14.8334 8.37305C14.9357 8.28125 15 8.14844 15 8C15 7.85352 14.937 7.72266 14.8365 7.63086C14.7983 7.5957 14.7547 7.56641 14.7072 7.54492C14.644 7.51562 14.5739 7.5 14.5 7.5H6.93707C6.71515 6.63672 5.93204 6 5 6C4.06796 6 3.28485 6.63672 3.06293 7.5ZM6 8C6 7.44727 5.55228 7 5 7C4.44772 7 4 7.44727 4 8C4 8.55273 4.44772 9 5 9C5.55228 9 6 8.55273 6 8Z"
                ></path>
            </svg>
            {alt ? <span className="sr-only">{alt}</span> : null}
        </>
    );
};
