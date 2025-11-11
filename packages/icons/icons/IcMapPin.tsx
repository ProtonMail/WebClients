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

export const IcMapPin = ({ alt, title, size = 4, className = '', viewBox = '0 0 16 16', ...rest }: IconProps) => {
    return (
        <>
            {/* eslint-disable-next-line jsx-a11y/prefer-tag-over-role */}
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
                    d="M8 4.5a2 2 0 1 1 0 4 2 2 0 0 1 0-4Zm0 1a1 1 0 1 0 0 2 1 1 0 0 0 0-2Z"
                    clipRule="evenodd"
                ></path>
                <path
                    fillRule="evenodd"
                    d="M8 1a5.5 5.5 0 0 1 5.5 5.5c0 3.581-3.484 7.036-4.906 8.297a.885.885 0 0 1-1.122.054l-.066-.054C5.984 13.536 2.5 10.08 2.5 6.5A5.5 5.5 0 0 1 8 1Zm0 1a4.5 4.5 0 0 0-4.5 4.5c0 1.484.732 3.035 1.733 4.438.955 1.337 2.077 2.43 2.767 3.048.69-.618 1.812-1.71 2.767-3.049 1-1.402 1.733-2.953 1.733-4.437A4.5 4.5 0 0 0 8 2Z"
                    clipRule="evenodd"
                ></path>
            </svg>
            {alt ? <span className="sr-only">{alt}</span> : null}
        </>
    );
};
