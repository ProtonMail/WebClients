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

export const IcCreditCards = ({ alt, title, size = 4, className = '', viewBox = '0 0 16 16', ...rest }: IconProps) => {
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

                <path d="M10 8.5a.5.5 0 0 1 .5-.5h2a.5.5 0 0 1 .5.5v1a.5.5 0 0 1-.5.5h-2a.5.5 0 0 1-.5-.5v-1Z"></path>
                <path
                    fillRule="evenodd"
                    d="M11.653 2.008A1.5 1.5 0 0 1 13 3.5V5H2v3.5a.5.5 0 0 0 .5.5H3V7.5A1.5 1.5 0 0 1 4.5 6h9l.153.008A1.5 1.5 0 0 1 15 7.5v5l-.008.153a1.5 1.5 0 0 1-1.339 1.34L13.5 14h-9l-.153-.008a1.5 1.5 0 0 1-1.34-1.339L3 12.5V10h-.5l-.153-.008a1.5 1.5 0 0 1-1.34-1.339L1 8.5v-5A1.5 1.5 0 0 1 2.5 2h9l.153.008ZM4.5 7a.5.5 0 0 0-.5.5v5a.5.5 0 0 0 .5.5h9a.5.5 0 0 0 .5-.5v-5a.5.5 0 0 0-.5-.5h-9Zm-2-4a.5.5 0 0 0-.5.5V4h10v-.5a.5.5 0 0 0-.5-.5h-9Z"
                    clipRule="evenodd"
                ></path>
            </svg>
            {alt ? <span className="sr-only">{alt}</span> : null}
        </>
    );
};
