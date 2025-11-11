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

export const IcFolderOpen = ({ alt, title, size = 4, className = '', viewBox = '0 0 16 16', ...rest }: IconProps) => {
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
                    d="M2.61 14H2.5A1.5 1.5 0 0 1 1 12.5v-8A1.5 1.5 0 0 1 2.5 3h2.764a1.5 1.5 0 0 1 .67.158L7.619 4H12.5A1.5 1.5 0 0 1 14 5.5V7h.787a.75.75 0 0 1 .67 1.085l-2.68 5.362a1 1 0 0 1-.895.553H2.611ZM2 4.5a.5.5 0 0 1 .5-.5h2.764a.5.5 0 0 1 .224.053l1.746.873A.7.7 0 0 0 7.547 5H12.5a.5.5 0 0 1 .5.5V7H5.427a1.5 1.5 0 0 0-1.342.83L2 12V4.5Zm.618 8.5L4.98 8.276A.5.5 0 0 1 5.427 8h8.955l-2.5 5H2.618Z"
                ></path>
            </svg>
            {alt ? <span className="sr-only">{alt}</span> : null}
        </>
    );
};
