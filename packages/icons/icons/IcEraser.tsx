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

export const IcEraser = ({ alt, title, size = 4, className = '', viewBox = '0 0 16 16', ...rest }: IconProps) => {
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
                    d="m10.881 2.294 2.825 2.825a1 1 0 0 1 0 1.414l-1.603 1.602-4.24-4.239 1.604-1.602a1 1 0 0 1 1.414 0Zm-3.724 2.31L3.293 8.466a1 1 0 0 0 0 1.414l2.825 2.825a1 1 0 0 0 1.414 0l3.864-3.863-4.24-4.24Zm5.273 4.619-3.778 3.778H14.5a.5.5 0 1 1 0 1h-13a.5.5 0 0 1 0-1H5l-2.414-2.413a2 2 0 0 1 0-2.828L8.76 1.587a2 2 0 0 1 2.828 0l2.825 2.824a2 2 0 0 1 0 2.829l-1.93 1.93a.484.484 0 0 1-.053.053Z"
                ></path>
            </svg>
            {alt ? <span className="sr-only">{alt}</span> : null}
        </>
    );
};
