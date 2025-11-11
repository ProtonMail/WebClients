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

export const IcCalendarMonth = ({
    alt,
    title,
    size = 4,
    className = '',
    viewBox = '0 0 16 16',
    ...rest
}: IconProps) => {
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
                    d="M11 3H5V1.5a.5.5 0 0 0-1 0V3a3 3 0 0 0-3 3v6a3 3 0 0 0 3 3h8a3 3 0 0 0 3-3V6a3 3 0 0 0-3-3V1.5a.5.5 0 0 0-1 0V3ZM4 4h1v2H2a2 2 0 0 1 2-2Zm1 3H2v4h3V7Zm1 4V7h4v4H6Zm-1 1H2a2 2 0 0 0 2 2h1v-2Zm1 2h4v-2H6v2Zm0-8V4h4v2H6Zm5 0V4h1a2 2 0 0 1 2 2h-3Zm0 1v4h3V7h-3Zm3 5a2 2 0 0 1-2 2h-1v-2h3Z"
                ></path>
            </svg>
            {alt ? <span className="sr-only">{alt}</span> : null}
        </>
    );
};
