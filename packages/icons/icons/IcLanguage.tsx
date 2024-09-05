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

export const IcLanguage = ({ alt, title, size = 4, className = '', viewBox = '0 0 16 16', ...rest }: IconProps) => {
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
                    d="M9.086 11.007H14a1 1 0 0 0 1-1.002V3.001A1 1 0 0 0 14 2H2a1 1 0 0 0-1 1.001v7.004a1 1 0 0 0 1 1.002h5V13.094L8.793 11.3l.293-.293ZM7 14.508l-.01.01-.12.121-.255.255A.36.36 0 0 1 6 14.639v-2.632H2a2 2 0 0 1-2-2.002V3.001A2 2 0 0 1 2 1h12a2 2 0 0 1 2 2.001v7.004a2 2 0 0 1-2 2.002H9.5L7 14.508ZM4.5 3.5a.5.5 0 0 1 .465.314l2 5a.5.5 0 0 1-.93.372L5.563 8H3.439l-.475 1.186a.5.5 0 0 1-.928-.372l2-5A.5.5 0 0 1 4.5 3.5ZM3.84 7h1.323L4.5 5.346 3.84 7Zm7.16-3.5a.5.5 0 1 0-1 0V4H8.5a.5.5 0 0 0 0 1h2.964c-.108.714-.446 1.361-.963 1.939a4.397 4.397 0 0 1-.513-.694.5.5 0 1 0-.86.51c.181.307.397.595.642.866a8.639 8.639 0 0 1-1.493.932.5.5 0 1 0 .448.894 9.497 9.497 0 0 0 1.775-1.132 9.49 9.49 0 0 0 1.777 1.132.5.5 0 0 0 .447-.894 8.638 8.638 0 0 1-1.491-.933c.667-.738 1.125-1.61 1.24-2.62H13a.5.5 0 1 0 0-1h-2v-.5Z"
                ></path>
            </svg>
            {alt ? <span className="sr-only">{alt}</span> : null}
        </>
    );
};
