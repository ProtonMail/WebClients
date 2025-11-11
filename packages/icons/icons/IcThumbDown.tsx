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

export const IcThumbDown = ({ alt, title, size = 4, className = '', viewBox = '0 0 16 16', ...rest }: IconProps) => {
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
                    d="M2 2h2.333a1 1 0 0 1 1 1v.07l.213-.13A6.333 6.333 0 0 1 8.865 2h2.15a3 3 0 0 1 2.874 2.138l.658 2.192a2.333 2.333 0 0 1-2.235 3.003h-1.018l-.514 4.111a1.396 1.396 0 0 1-1.384 1.223h-.223A1.173 1.173 0 0 1 8 13.493a4.427 4.427 0 0 0-1.136-2.961l-.276-.307-1.255-1.368V9a1 1 0 0 1-1 1H2V2Zm3.333 5.87 1.748 1.907.278.309a5.094 5.094 0 0 1 1.308 3.407c0 .28.227.507.506.507h.223a.729.729 0 0 0 .723-.639l.514-4.11a.667.667 0 0 1 .661-.584h1.018a1.667 1.667 0 0 0 1.596-2.146l-.657-2.191a2.333 2.333 0 0 0-2.235-1.663H8.865a5.667 5.667 0 0 0-2.97.84l-.562.346V7.87ZM2.667 2.667v6.666h1.666A.334.334 0 0 0 4.667 9V3a.333.333 0 0 0-.334-.333H2.667Z"
                    clipRule="evenodd"
                ></path>
            </svg>
            {alt ? <span className="sr-only">{alt}</span> : null}
        </>
    );
};
