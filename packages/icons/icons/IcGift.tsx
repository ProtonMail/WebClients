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

export const IcGift = ({ alt, title, size = 4, className = '', viewBox = '0 0 16 16', ...rest }: IconProps) => {
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
                    d="M8 3.5A1.5 1.5 0 1 0 6.5 5H8V3.5Zm-4 0c0 .563.186 1.082.5 1.5H2a1 1 0 0 0-1 1v2a1 1 0 0 0 1 1v5a2 2 0 0 0 2 2h9a2 2 0 0 0 2-2V9a1 1 0 0 0 1-1V6a1 1 0 0 0-1-1h-2.5a2.5 2.5 0 0 0-4-3A2.5 2.5 0 0 0 4 3.5ZM2 6h5.99v2H2V6Zm5.99 3H3v5a1 1 0 0 0 1 1h3.99V9Zm1 6V9H14v5a1 1 0 0 1-1 1H8.99Zm0-7V6H15v2H8.99ZM12 3.5A1.5 1.5 0 0 1 10.5 5H9V3.5a1.5 1.5 0 1 1 3 0Z"
                ></path>
            </svg>
            {alt ? <span className="sr-only">{alt}</span> : null}
        </>
    );
};
