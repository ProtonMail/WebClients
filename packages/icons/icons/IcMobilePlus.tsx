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

export const IcMobilePlus = ({ alt, title, size = 4, className = '', viewBox = '0 0 16 16', ...rest }: IconProps) => {
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
                    d="M1 3a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v3h-1V3a1 1 0 0 0-1-1H3a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1v-2h1v2a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V3Zm6.5 9.5a.5.5 0 0 1-.5.5H5a.5.5 0 0 1 0-1h2a.5.5 0 0 1 .5.5Zm5.5-6a.5.5 0 0 0-1 0V8h-1.5a.5.5 0 0 0 0 1H12v1.5a.5.5 0 0 0 1 0V9h1.5a.5.5 0 0 0 0-1H13V6.5Z"
                ></path>
            </svg>
            {alt ? <span className="sr-only">{alt}</span> : null}
        </>
    );
};
