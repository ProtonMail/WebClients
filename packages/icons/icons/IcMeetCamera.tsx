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

export const IcMeetCamera = ({ alt, title, size = 4, className = '', viewBox = '0 0 16 16', ...rest }: IconProps) => {
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
                    d="M9.33398 2.66602C10.4382 2.66632 11.3338 3.56179 11.334 4.66602V6.7041L14.9463 4.12402L15.0254 4.07617C15.2157 3.97684 15.4444 3.97427 15.6387 4.07422C15.8605 4.18855 16 4.41741 16 4.66699V11.334C15.9997 11.5834 15.8605 11.8126 15.6387 11.9268C15.4168 12.0409 15.1494 12.0208 14.9463 11.876L11.334 9.2959V11.333C11.334 12.4374 10.4383 13.3327 9.33398 13.333H2C0.89558 13.3328 0 12.4375 0 11.333V4.66602C0.000175901 3.5617 0.895689 2.66619 2 2.66602H9.33398ZM2 4C1.63207 4.00018 1.33416 4.29808 1.33398 4.66602V11.333C1.33398 11.7011 1.63196 11.9998 2 12H9.33398C9.70191 11.9997 10 11.701 10 11.333V4.66602C9.99982 4.29817 9.7018 4.00031 9.33398 4H2ZM11.8135 8L14.667 10.0381V5.96191L11.8135 8Z"
                    fill="currentColor"
                ></path>
            </svg>
            {alt ? <span className="sr-only">{alt}</span> : null}
        </>
    );
};
