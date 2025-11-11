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

export const IcVideoCamera = ({ alt, title, size = 4, className = '', viewBox = '0 0 16 16', ...rest }: IconProps) => {
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
                    clipRule="evenodd"
                    d="M13.7699 3.95759C14.2584 3.55051 15 3.89788 15 4.53376V11.4662C15 12.1021 14.2584 12.4495 13.7699 12.0424L11.5397 10.184C11.1977 9.89897 11 9.47679 11 9.03162V6.96837C11 6.52321 11.1977 6.10103 11.5397 5.81604L13.7699 3.95759ZM14 5.06752L12.1799 6.58426C12.0659 6.67926 12 6.81998 12 6.96837V9.03162C12 9.18002 12.0659 9.32074 12.1799 9.41574L14 10.9325V5.06752Z"
                ></path>
                <path
                    fillRule="evenodd"
                    clipRule="evenodd"
                    d="M1 5C1 3.89543 1.89543 3 3 3H8C9.10457 3 10 3.89543 10 5V5.5C10 5.77614 9.77614 6 9.5 6C9.22386 6 9 5.77614 9 5.5V5C9 4.44772 8.55228 4 8 4H3C2.44772 4 2 4.44772 2 5V11C2 11.5523 2.44772 12 3 12H8C8.55228 12 9 11.5523 9 11V10.5C9 10.2239 9.22386 10 9.5 10C9.77614 10 10 10.2239 10 10.5V11C10 12.1046 9.10457 13 8 13H3C1.89543 13 1 12.1046 1 11V5Z"
                ></path>
            </svg>
            {alt ? <span className="sr-only">{alt}</span> : null}
        </>
    );
};
