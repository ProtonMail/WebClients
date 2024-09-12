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

export const IcUsersMerge = ({ alt, title, size = 4, className = '', viewBox = '0 0 16 16', ...rest }: IconProps) => {
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
                    d="M3.5 2a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3ZM3 3.5a.5.5 0 1 1 1 0 .5.5 0 0 1-1 0Z"
                ></path>
                <path
                    fillRule="evenodd"
                    d="M3.5 12a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3ZM3 13.5a.5.5 0 1 1 1 0 .5.5 0 0 1-1 0Z"
                ></path>
                <path
                    fillRule="evenodd"
                    d="M11.085 8a1.5 1.5 0 1 1 0 1H9v3.5A1.5 1.5 0 0 1 7.5 14H6v-1h1.5a.5.5 0 0 0 .5-.5v-8a.5.5 0 0 0-.5-.5H6V3h1.5A1.5 1.5 0 0 1 9 4.5V8h2.085ZM12.5 8a.5.5 0 1 0 0 1 .5.5 0 0 0 0-1Z"
                ></path>
            </svg>
            {alt ? <span className="sr-only">{alt}</span> : null}
        </>
    );
};
