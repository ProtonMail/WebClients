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

export const IcShieldHalfFilled = ({
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
                    d="M3.657 9.126c-.664-1.743-.748-3.62-.587-5.403L8 2.03l4.93 1.694c.16 1.784.077 3.66-.587 5.403-.67 1.761-1.958 3.456-4.343 4.802-2.385-1.346-3.673-3.04-4.343-4.802Zm4.182-8.099-5.4 1.856a.495.495 0 0 0-.332.415c-.418 3.917.17 8.692 5.664 11.645a.488.488 0 0 0 .459 0c5.492-2.953 6.08-7.728 5.663-11.645a.495.495 0 0 0-.333-.415L8.162 1.027a.497.497 0 0 0-.323 0ZM7.893 3A.311.311 0 0 1 8 2.98V13a.307.307 0 0 1-.153-.041C4.185 10.849 3.721 7.439 4 4.64a.35.35 0 0 1 .222-.297L7.892 3Z"
                ></path>
            </svg>
            {alt ? <span className="sr-only">{alt}</span> : null}
        </>
    );
};
