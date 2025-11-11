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

export const IcPassAllVaults = ({
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
                    clipRule="evenodd"
                    d="M13.5756 6.97095L9.02537 2.42072C8.45911 1.85446 7.54102 1.85446 6.97475 2.42072L11.64 7.1C12.13 7.59 12.13 8.4 11.64 8.89L6.97476 13.5718C7.54102 14.1381 8.45911 14.1381 9.02537 13.5718L13.5756 9.02156C14.1419 8.4553 14.1419 7.53721 13.5756 6.97095ZM9.73247 1.71361C8.77569 0.756828 7.22443 0.75683 6.26765 1.71361L1.71742 6.26384C0.760633 7.22063 0.760634 8.77188 1.71742 9.72867L6.26765 14.2789C7.22443 15.2357 8.77569 15.2357 9.73247 14.2789L14.2827 9.72867C15.2395 8.77188 15.2395 7.22063 14.2827 6.26384L9.73247 1.71361Z"
                ></path>
            </svg>
            {alt ? <span className="sr-only">{alt}</span> : null}
        </>
    );
};
