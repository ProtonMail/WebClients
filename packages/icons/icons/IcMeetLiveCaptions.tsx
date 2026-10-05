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

export const IcMeetLiveCaptions = ({
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

                <path d="M14.2754 1.25977C14.6896 1.25977 15.0254 1.59555 15.0254 2.00977V11.1377C15.0254 11.5519 14.6896 11.8877 14.2754 11.8877H8.81152L5.0127 14.6006C4.78424 14.7636 4.48401 14.7855 4.23438 14.6572C3.98457 14.5287 3.82715 14.2712 3.82715 13.9902V11.8877H1.72461C1.3104 11.8877 0.974609 11.5519 0.974609 11.1377V2.00977C0.974609 1.59555 1.3104 1.25977 1.72461 1.25977H14.2754ZM2.47461 10.3877H4.57715C4.99132 10.3877 5.32712 10.7235 5.32715 11.1377V12.5322L8.13477 10.5273L8.23438 10.4678C8.33822 10.4157 8.45307 10.3877 8.57031 10.3877H13.5254V2.75977H2.47461V10.3877ZM8.57129 7.53516C8.98529 7.5354 9.32129 7.8711 9.32129 8.28516C9.32129 8.69922 8.98529 9.03491 8.57129 9.03516H4.00684C3.59262 9.03516 3.25684 8.69937 3.25684 8.28516C3.25684 7.87094 3.59262 7.53516 4.00684 7.53516H8.57129ZM11.9932 7.53516C12.4074 7.53516 12.7432 7.87094 12.7432 8.28516C12.7432 8.69937 12.4074 9.03516 11.9932 9.03516H10.8525C10.4383 9.03516 10.1025 8.69937 10.1025 8.28516C10.1025 7.87094 10.4383 7.53516 10.8525 7.53516H11.9932Z"></path>
            </svg>
            {alt ? <span className="sr-only">{alt}</span> : null}
        </>
    );
};
