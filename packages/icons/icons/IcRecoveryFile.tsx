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

export const IcRecoveryFile = ({ alt, title, size = 4, className = '', viewBox = '0 0 16 16', ...rest }: IconProps) => {
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

                <path d="M3 12C3 12.5523 3.44772 13 4 13H12C12.5523 13 13 12.5523 13 12V11C13 10.7239 13.2239 10.5 13.5 10.5C13.7761 10.5 14 10.7239 14 11V12C14 13.1046 13.1046 14 12 14H4C2.89543 14 2 13.1046 2 12H3ZM4 8.5C4 8.22386 3.77614 8 3.5 8C3.22386 8 3 8.22386 3 8.5V9.5C3 9.77614 3.22386 10 3.5 10C3.77614 10 4 9.77614 4 9.5V8.5ZM7.5 7C7.77614 7 8 7.22386 8 7.5V10H8.5C8.77612 10 8.99997 10.2239 9 10.5C9 10.7761 8.77614 11 8.5 11H6.5C6.22387 11 6 10.7761 6 10.5C6.00003 10.2239 6.22389 10 6.5 10H7V8H6.5C6.22386 8 6 7.77614 6 7.5C6 7.22386 6.22386 7 6.5 7H7.5ZM14.3369 7.33301C14.3367 6.87296 13.9631 6.5 13.5029 6.5C13.043 6.50013 12.6701 6.87296 12.6699 7.33301C12.6699 7.79314 13.0428 8.16682 13.5029 8.16699C13.9632 8.16699 14.3369 7.79324 14.3369 7.33301ZM2 4C2 2.89543 2.89543 2 4 2H11C11.2761 2 11.5 2.22386 11.5 2.5C11.5 2.77614 11.2761 3 11 3H4C3.44772 3 3 3.44772 3 4V6H2V4ZM5 9.5C5 10.3284 4.32843 11 3.5 11C2.67157 11 2 10.3284 2 9.5V8.5C2 7.67157 2.67157 7 3.5 7C4.32843 7 5 7.67157 5 8.5V9.5ZM15.3369 7.33301C15.3369 8.34553 14.5155 9.16699 13.5029 9.16699C12.4906 9.16682 11.6699 8.34542 11.6699 7.33301C11.6701 6.4942 12.2338 5.78812 13.0029 5.57031V2C13.0029 1.72394 13.2269 1.50013 13.5029 1.5C13.7791 1.5 14.0029 1.72386 14.0029 2V2.83398H14.8369C15.1129 2.8342 15.3369 3.05798 15.3369 3.33398C15.3369 3.60999 15.1129 3.83376 14.8369 3.83398H14.0029V5.56934C14.7724 5.7869 15.3368 6.49388 15.3369 7.33301Z"></path>
            </svg>
            {alt ? <span className="sr-only">{alt}</span> : null}
        </>
    );
};
