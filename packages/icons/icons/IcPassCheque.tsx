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

export const IcPassCheque = ({ alt, title, size = 4, className = '', viewBox = '0 0 16 16', ...rest }: IconProps) => {
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
                    d="M3.5 0C3.22386 0 3 0.223858 3 0.5V10.5C3 10.7761 3.22386 11 3.5 11C3.77614 11 4 10.7761 4 10.5V1H15V13.5C15 14.3289 14.3289 15 13.5 15C12.6711 15 12 14.3289 12 13.5V12.5C12 12.2239 11.7761 12 11.5 12H0.5C0.223858 12 0 12.2239 0 12.5V13.5C0 14.8811 1.11886 16 2.5 16H13.5C14.8811 16 16 14.8811 16 13.5V0.5C16 0.223858 15.7761 0 15.5 0H3.5ZM6.5 4C6.22386 4 6 4.22386 6 4.5C6 4.77614 6.22386 5 6.5 5H12.5C12.7761 5 13 4.77614 13 4.5C13 4.22386 12.7761 4 12.5 4H6.5ZM6.5 7C6.22386 7 6 7.22386 6 7.5C6 7.77614 6.22386 8 6.5 8H12.5C12.7761 8 13 7.77614 13 7.5C13 7.22386 12.7761 7 12.5 7H6.5ZM11.4996 15C11.1858 14.5822 11 14.0629 11 13.5V13H1V13.5C1 14.3289 1.67114 15 2.5 15H11.4996Z"
                ></path>
            </svg>
            {alt ? <span className="sr-only">{alt}</span> : null}
        </>
    );
};
