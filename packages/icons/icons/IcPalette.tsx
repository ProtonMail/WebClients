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

export const IcPalette = ({ alt, title, size = 4, className = '', viewBox = '0 0 16 16', ...rest }: IconProps) => {
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

                <path d="M6 9a1 1 0 1 1-2 0 1 1 0 0 1 2 0Z"></path>
                <path d="M6 7a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z"></path>
                <path d="M10 5a1 1 0 1 1-2 0 1 1 0 0 1 2 0Z"></path>
                <path d="M12 7a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z"></path>
                <path
                    fillRule="evenodd"
                    d="M1 8.5a7.5 7.5 0 1 1 15 0c0 .291-.017.538-.051.766-.176 1.152-1.31 1.734-2.284 1.734H9.387a.887.887 0 0 0-.887.887v.031c0 .509.254.984.677 1.266l.165.11A1.477 1.477 0 0 1 8.522 16H8.5A7.5 7.5 0 0 1 1 8.5ZM8.5 2a6.5 6.5 0 0 0 0 13h.023a.477.477 0 0 0 .265-.874l-.165-.11A2.521 2.521 0 0 1 7.5 11.918v-.031C7.5 10.845 8.344 10 9.386 10h4.279c.683 0 1.22-.398 1.295-.885.026-.167.04-.362.04-.615A6.5 6.5 0 0 0 8.5 2Z"
                ></path>
            </svg>
            {alt ? <span className="sr-only">{alt}</span> : null}
        </>
    );
};
