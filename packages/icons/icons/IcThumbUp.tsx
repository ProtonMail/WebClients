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

export const IcThumbUp = ({ alt, title, size = 4, className = '', viewBox = '0 0 16 16', ...rest }: IconProps) => {
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
                    d="M2 14h2.333a1 1 0 0 0 1-1v-.07l.213.13c.998.615 2.147.94 3.319.94h2.15a3 3 0 0 0 2.874-2.138l.658-2.192a2.333 2.333 0 0 0-2.235-3.003h-1.018l-.514-4.111a1.396 1.396 0 0 0-1.384-1.223h-.223C8.525 1.333 8 1.86 8 2.507a4.427 4.427 0 0 1-1.136 2.961l-.276.307-1.255 1.368V7a1 1 0 0 0-1-1H2v8Zm3.333-5.87 1.748-1.907.278-.309a5.093 5.093 0 0 0 1.308-3.407c0-.28.227-.507.506-.507h.223a.73.73 0 0 1 .723.639l.514 4.11a.667.667 0 0 0 .661.584h1.018a1.667 1.667 0 0 1 1.596 2.146l-.657 2.192a2.333 2.333 0 0 1-2.235 1.662H8.865a5.667 5.667 0 0 1-2.97-.84l-.562-.346V8.13Zm-2.666 5.203V6.667h1.666c.184 0 .334.149.334.333v6c0 .184-.15.333-.334.333H2.667Z"
                    clipRule="evenodd"
                ></path>
            </svg>
            {alt ? <span className="sr-only">{alt}</span> : null}
        </>
    );
};
