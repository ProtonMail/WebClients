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

export const IcSliders2 = ({ alt, title, size = 4, className = '', viewBox = '0 0 16 16', ...rest }: IconProps) => {
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
                    d="M4.5 1a.5.5 0 0 1 .5.5v6.55a2.501 2.501 0 0 1 0 4.9v1.55a.5.5 0 0 1-1 0v-1.55a2.5 2.5 0 0 1 0-4.9V1.5a.5.5 0 0 1 .5-.5Zm0 8a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3Zm7-8a.5.5 0 0 1 .5.5v1.55a2.501 2.501 0 0 1 0 4.9v6.55a.5.5 0 0 1-1 0V7.95a2.5 2.5 0 0 1 0-4.9V1.5a.5.5 0 0 1 .5-.5Zm0 3a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3Z"
                    clipRule="evenodd"
                ></path>
            </svg>
            {alt ? <span className="sr-only">{alt}</span> : null}
        </>
    );
};
