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

export const IcMoneyBills = ({ alt, title, size = 4, className = '', viewBox = '0 0 16 16', ...rest }: IconProps) => {
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

                <path fillRule="evenodd" d="M9 9a2 2 0 1 0 0-4 2 2 0 0 0 0 4Zm0-1a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z"></path>
                <path
                    fillRule="evenodd"
                    d="M4.5 3A1.5 1.5 0 0 0 3 4.5v5A1.5 1.5 0 0 0 4.5 11h9A1.5 1.5 0 0 0 15 9.5v-5A1.5 1.5 0 0 0 13.5 3h-9Zm9 1h-1A1.5 1.5 0 0 0 14 5.5v-1a.5.5 0 0 0-.5-.5Zm-7 0h5A2.5 2.5 0 0 0 14 6.5v1a2.5 2.5 0 0 0-2.5 2.5h-5A2.5 2.5 0 0 0 4 7.5v-1A2.5 2.5 0 0 0 6.5 4Zm-1 0h-1a.5.5 0 0 0-.5.5v1A1.5 1.5 0 0 0 5.5 4ZM4 8.5A1.5 1.5 0 0 1 5.5 10h-1a.5.5 0 0 1-.5-.5v-1Zm8.5 1.5h1a.5.5 0 0 0 .5-.5v-1a1.5 1.5 0 0 0-1.5 1.5Z"
                ></path>
                <path d="M2 5.5a.5.5 0 0 0-1 0v5A2.5 2.5 0 0 0 3.5 13h10a.5.5 0 0 0 0-1h-10A1.5 1.5 0 0 1 2 10.5v-5Z"></path>
            </svg>
            {alt ? <span className="sr-only">{alt}</span> : null}
        </>
    );
};
