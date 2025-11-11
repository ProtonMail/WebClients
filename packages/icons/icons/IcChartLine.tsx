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

export const IcChartLine = ({ alt, title, size = 4, className = '', viewBox = '0 0 16 16', ...rest }: IconProps) => {
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

                <path d="M2 2.5a.5.5 0 0 0-1 0v10A2.5 2.5 0 0 0 3.5 15h10a.5.5 0 0 0 0-1h-10A1.5 1.5 0 0 1 2 12.5v-10Z"></path>
                <path d="M13.854 5.854a.5.5 0 0 0-.708-.708L10 8.293 7.854 6.146a.5.5 0 0 0-.708 0l-3.5 3.5a.5.5 0 0 0 .708.708L7.5 7.207l2.146 2.147a.5.5 0 0 0 .708 0l3.5-3.5Z"></path>
            </svg>
            {alt ? <span className="sr-only">{alt}</span> : null}
        </>
    );
};
