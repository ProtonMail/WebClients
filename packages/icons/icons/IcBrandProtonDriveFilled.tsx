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

export const IcBrandProtonDriveFilled = ({
    alt,
    title,
    size = 4,
    className = '',
    viewBox = '0 0 16 16',
    ...rest
}: IconProps) => {
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
                    d="M3.01 3.004a1 1 0 0 0-.995.897h1.452c.612 0 1.2.246 1.63.682l.031.033c.242.246.572.384.917.384H11a1 1 0 0 1 1 1v6.996h.997a1 1 0 0 0 1-1v-6.95a1 1 0 0 0-1-1H6.918c-.375 0-.743-.103-1.065-.297l-.983-.593a1.063 1.063 0 0 0-.549-.152H3.01Zm-2 .998a2 2 0 0 1 2-1.998H4.32c.375 0 .744.102 1.065.296l.984.593c.165.1.355.152.548.152h6.079a2 2 0 0 1 2 2v6.951a2 2 0 0 1-2 2H3.004a2 2 0 0 1-2-2.001l.006-7.993Z"
                ></path>
            </svg>
            {alt ? <span className="sr-only">{alt}</span> : null}
        </>
    );
};
