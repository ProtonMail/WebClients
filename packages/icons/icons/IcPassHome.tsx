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

export const IcPassHome = ({ alt, title, size = 4, className = '', viewBox = '0 0 16 16', ...rest }: IconProps) => {
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

                <path d="M8.34116 0.134472C8.14906 -0.0448241 7.85095 -0.0448241 7.65884 0.134472L0.158843 7.13447C-0.0430326 7.32289 -0.0539428 7.63928 0.134474 7.84116C0.322891 8.04303 0.639286 8.05394 0.841161 7.86553L8 1.18394L15.1588 7.86553C15.3607 8.05394 15.6771 8.04303 15.8655 7.84116C16.0539 7.63928 16.043 7.32289 15.8412 7.13447L8.34116 0.134472Z"></path>
                <path d="M3 8.5C3 8.22386 2.77614 8 2.5 8C2.22386 8 2 8.22386 2 8.5V15.5C2 15.7761 2.22386 16 2.5 16H6.5C6.77614 16 7 15.7761 7 15.5V12H9V15.5C9 15.7761 9.22386 16 9.5 16H13.5C13.7761 16 14 15.7761 14 15.5V8.5C14 8.22386 13.7761 8 13.5 8C13.2239 8 13 8.22386 13 8.5V15H10V11.5C10 11.2239 9.77614 11 9.5 11H6.5C6.22386 11 6 11.2239 6 11.5V15H3V8.5Z"></path>
            </svg>
            {alt ? <span className="sr-only">{alt}</span> : null}
        </>
    );
};
