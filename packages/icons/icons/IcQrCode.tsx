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

export const IcQrCode = ({ alt, title, size = 4, className = '', viewBox = '0 0 16 16', ...rest }: IconProps) => {
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
                    d="M1 2.5A1.5 1.5 0 0 1 2.5 1H6a1.5 1.5 0 0 1 1.5 1.5V6A1.5 1.5 0 0 1 6 7.5H2.5A1.5 1.5 0 0 1 1 6V2.5ZM2.5 2a.5.5 0 0 0-.5.5V6a.5.5 0 0 0 .5.5H6a.5.5 0 0 0 .5-.5V2.5A.5.5 0 0 0 6 2H2.5ZM8.5 2.5A1.5 1.5 0 0 1 10 1h3.5A1.5 1.5 0 0 1 15 2.5V6a1.5 1.5 0 0 1-1.5 1.5H10A1.5 1.5 0 0 1 8.5 6V2.5ZM10 2a.5.5 0 0 0-.5.5V6a.5.5 0 0 0 .5.5h3.5A.5.5 0 0 0 14 6V2.5a.5.5 0 0 0-.5-.5H10ZM1 10a1.5 1.5 0 0 1 1.5-1.5H6A1.5 1.5 0 0 1 7.5 10v3.5A1.5 1.5 0 0 1 6 15H2.5A1.5 1.5 0 0 1 1 13.5V10Zm1.5-.5a.5.5 0 0 0-.5.5v3.5a.5.5 0 0 0 .5.5H6a.5.5 0 0 0 .5-.5V10a.5.5 0 0 0-.5-.5H2.5Z"
                ></path>
                <path d="M10.88 3.88a.5.5 0 0 1 .5-.5h.75a.5.5 0 0 1 .5.5v.75a.5.5 0 0 1-.5.5h-.75a.5.5 0 0 1-.5-.5v-.75ZM3.38 3.88a.5.5 0 0 1 .5-.5h.75a.5.5 0 0 1 .5.5v.75a.5.5 0 0 1-.5.5h-.75a.5.5 0 0 1-.5-.5v-.75ZM3.38 11.38a.5.5 0 0 1 .5-.5h.75a.5.5 0 0 1 .5.5v.75a.5.5 0 0 1-.5.5h-.75a.5.5 0 0 1-.5-.5v-.75ZM13.25 13.75a.5.5 0 0 1 .5-.5h.75a.5.5 0 0 1 .5.5v.75a.5.5 0 0 1-.5.5h-.75a.5.5 0 0 1-.5-.5v-.75ZM13.25 9a.5.5 0 0 1 .5-.5h.75a.5.5 0 0 1 .5.5v.75a.5.5 0 0 1-.5.5h-.75a.5.5 0 0 1-.5-.5V9ZM8.5 13.75a.5.5 0 0 1 .5-.5h.75a.5.5 0 0 1 .5.5v.75a.5.5 0 0 1-.5.5H9a.5.5 0 0 1-.5-.5v-.75ZM8.5 9a.5.5 0 0 1 .5-.5h.75a.5.5 0 0 1 .5.5v.75a.5.5 0 0 1-.5.5H9a.5.5 0 0 1-.5-.5V9ZM10.88 11.38a.5.5 0 0 1 .5-.5h.75a.5.5 0 0 1 .5.5v.75a.5.5 0 0 1-.5.5h-.75a.5.5 0 0 1-.5-.5v-.75Z"></path>
            </svg>
            {alt ? <span className="sr-only">{alt}</span> : null}
        </>
    );
};
