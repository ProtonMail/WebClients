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

export const IcEmoji = ({ alt, title, size = 4, className = '', viewBox = '0 0 16 16', ...rest }: IconProps) => {
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
                    d="M13.9286 7.5C13.9286 11.0504 11.0504 13.9286 7.5 13.9286C3.9496 13.9286 1.07143 11.0504 1.07143 7.5C1.07143 3.9496 3.9496 1.07143 7.5 1.07143C11.0504 1.07143 13.9286 3.9496 13.9286 7.5ZM15 7.5C15 11.6421 11.6421 15 7.5 15C3.35786 15 0 11.6421 0 7.5C0 3.35786 3.35786 0 7.5 0C11.6421 0 15 3.35786 15 7.5ZM10.1786 7.5C10.7703 7.5 11.25 7.0203 11.25 6.42857C11.25 5.83684 10.7703 5.35714 10.1786 5.35714C9.58684 5.35714 9.10714 5.83684 9.10714 6.42857C9.10714 7.0203 9.58684 7.5 10.1786 7.5ZM5.89286 6.42857C5.89286 7.0203 5.41316 7.5 4.82143 7.5C4.22969 7.5 3.75 7.0203 3.75 6.42857C3.75 5.83684 4.22969 5.35714 4.82143 5.35714C5.41316 5.35714 5.89286 5.83684 5.89286 6.42857ZM3.92251 9.73245C3.80778 9.41595 4.06254 9.10714 4.3992 9.10714H10.6008C10.9375 9.10714 11.1922 9.41595 11.0775 9.73245C10.5289 11.246 9.13404 12.3214 7.5 12.3214C5.86596 12.3214 4.47114 11.246 3.92251 9.73245Z"
                ></path>
            </svg>
            {alt ? <span className="sr-only">{alt}</span> : null}
        </>
    );
};
