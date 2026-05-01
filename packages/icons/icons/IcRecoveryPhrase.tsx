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

export const IcRecoveryPhrase = ({
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

                <path d="M2 12V4C2 2.89543 2.89543 2 4 2H11C11.2761 2 11.5 2.22386 11.5 2.5C11.5 2.77614 11.2761 3 11 3H4C3.44772 3 3 3.44772 3 4V12C3 12.5523 3.44772 13 4 13H12C12.5523 13 13 12.5523 13 12V11C13 10.7239 13.2239 10.5 13.5 10.5C13.7761 10.5 14 10.7239 14 11V12C14 13.1046 13.1046 14 12 14H4C2.89543 14 2 13.1046 2 12ZM10.5 10C10.7761 10 11 10.2239 11 10.5C11 10.7761 10.7761 11 10.5 11H5C4.72386 11 4.5 10.7761 4.5 10.5C4.5 10.2239 4.72386 10 5 10H10.5ZM14.3369 7.33301C14.3367 6.87296 13.9631 6.5 13.5029 6.5C13.043 6.50013 12.6701 6.87296 12.6699 7.33301C12.6699 7.79314 13.0428 8.16682 13.5029 8.16699C13.9632 8.16699 14.3369 7.79324 14.3369 7.33301ZM9 7.5C9.27614 7.5 9.5 7.72386 9.5 8C9.5 8.27614 9.27614 8.5 9 8.5H5C4.72386 8.5 4.5 8.27614 4.5 8C4.5 7.72386 4.72386 7.5 5 7.5H9ZM9 5C9.27614 5 9.5 5.22386 9.5 5.5C9.5 5.77614 9.27614 6 9 6H5C4.72386 6 4.5 5.77614 4.5 5.5C4.5 5.22386 4.72386 5 5 5H9ZM15.3369 7.33301C15.3369 8.34553 14.5155 9.16699 13.5029 9.16699C12.4906 9.16682 11.6699 8.34542 11.6699 7.33301C11.6701 6.4942 12.2338 5.78812 13.0029 5.57031V2C13.0029 1.72394 13.2269 1.50013 13.5029 1.5C13.7791 1.5 14.0029 1.72386 14.0029 2V2.83398H14.8369C15.1129 2.8342 15.3369 3.05798 15.3369 3.33398C15.3369 3.60999 15.1129 3.83376 14.8369 3.83398H14.0029V5.56934C14.7724 5.7869 15.3368 6.49388 15.3369 7.33301Z"></path>
            </svg>
            {alt ? <span className="sr-only">{alt}</span> : null}
        </>
    );
};
