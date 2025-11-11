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

export const IcBank = ({ alt, title, size = 4, className = '', viewBox = '0 0 16 16', ...rest }: IconProps) => {
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
                    d="M7.76 2.061a.5.5 0 0 1 .48 0l5.5 3A.5.5 0 0 1 14 5.5v1a.5.5 0 0 1-.5.5h-11a.5.5 0 0 1-.5-.5v-1a.5.5 0 0 1 .26-.439l5.5-3ZM3 5.797V6h10v-.203L8 3.07 3 5.797ZM11.5 8a.5.5 0 0 1 .5.5V13h1.5a.5.5 0 0 1 0 1h-11a.5.5 0 1 1 0-1H4V8.5a.5.5 0 0 1 1 0V13h2.5V8.5a.5.5 0 0 1 1 0V13H11V8.5a.5.5 0 0 1 .5-.5Z"
                ></path>
            </svg>
            {alt ? <span className="sr-only">{alt}</span> : null}
        </>
    );
};
