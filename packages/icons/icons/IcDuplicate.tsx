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

export const IcDuplicate = ({ alt, title, size = 4, className = '', viewBox = '0 0 16 16', ...rest }: IconProps) => {
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

                <path d="M2.5 4C2.77614 4 3 4.22386 3 4.5V12.5C3 13.3284 3.67157 14 4.5 14H12.5C12.7761 14 13 14.2239 13 14.5C13 14.7761 12.7761 15 12.5 15H4.5C3.11929 15 2 13.8807 2 12.5V4.5C2 4.22386 2.22386 4 2.5 4Z"></path>
                <path
                    fillRule="evenodd"
                    clipRule="evenodd"
                    d="M10.25 1C10.7828 1 11.2927 1.21567 11.6641 1.59766L13.4336 3.41797C13.7964 3.79119 13.9999 4.29101 14 4.81152V11L13.9893 11.2041C13.887 12.2128 13.0357 13 12 13H6L5.7959 12.9893C4.78722 12.887 4 12.0357 4 11V3C4 1.96435 4.78722 1.113 5.7959 1.01074L6 1H10.25ZM6 2C5.44772 2 5 2.44772 5 3V11C5 11.5523 5.44772 12 6 12H12C12.5523 12 13 11.5523 13 11V5.35742H11.25C10.4217 5.35742 9.75015 4.68572 9.75 3.85742V2H6ZM10.75 3.85742C10.7502 4.13344 10.974 4.35742 11.25 4.35742H12.8906C12.8456 4.26916 12.7871 4.18755 12.7168 4.11523L10.9473 2.29492C10.8881 2.23403 10.8216 2.18158 10.75 2.13867V3.85742Z"
                ></path>
            </svg>
            {alt ? <span className="sr-only">{alt}</span> : null}
        </>
    );
};
