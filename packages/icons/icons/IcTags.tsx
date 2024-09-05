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

export const IcTags = ({ alt, title, size = 4, className = '', viewBox = '0 0 16 16', ...rest }: IconProps) => {
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
                    d="m13.818 7.546-4.231 4.205L4 6.2V1.994h4.23l5.587 5.552Zm-3.524 4.908a1.004 1.004 0 0 1-1.414 0L3.293 6.902a.99.99 0 0 1-.292-.703V1.994A.997.997 0 0 1 4 1h4.23c.266 0 .52.105.708.291l5.586 5.552a.99.99 0 0 1 0 1.406l-4.231 4.205ZM7 3.982a.997.997 0 0 1-1 .994c-.552 0-1-.445-1-.994a.997.997 0 0 1 1-.994c.552 0 1 .445 1 .994ZM3.854 8.6a.502.502 0 0 0-.708 0 .495.495 0 0 0 0 .703l5.293 5.26a1.506 1.506 0 0 0 2.122 0l4.293-4.266a.495.495 0 0 0 0-.703.502.502 0 0 0-.708 0L9.854 13.86a.502.502 0 0 1-.708 0L3.854 8.6Z"
                ></path>
            </svg>
            {alt ? <span className="sr-only">{alt}</span> : null}
        </>
    );
};
