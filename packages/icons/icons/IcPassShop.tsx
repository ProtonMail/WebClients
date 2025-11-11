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

export const IcPassShop = ({ alt, title, size = 4, className = '', viewBox = '0 0 16 16', ...rest }: IconProps) => {
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
                    d="M2.56292 0.257179C2.65111 0.098446 2.81842 0 3 0H13C13.1816 0 13.3489 0.098446 13.4371 0.257179L15.9371 4.75718C15.9783 4.83146 16 4.91503 16 5C16 6.65714 14.6571 8 13 8C11.9564 8 11.0374 7.46741 10.5 6.65913C9.96259 7.46741 9.04362 8 8 8C6.95638 8 6.03741 7.46741 5.5 6.65914C4.96259 7.46741 4.04362 8 3 8C1.34286 8 0 6.65714 0 5C0 4.91503 0.0216553 4.83146 0.0629214 4.75718L2.56292 0.257179ZM6 5C6 6.10486 6.89514 7 8 7C9.10486 7 10 6.10486 10 5C10 4.72386 10.2239 4.5 10.5 4.5C10.7761 4.5 11 4.72386 11 5C11 6.10486 11.8951 7 13 7C14.0636 7 14.9328 6.17048 14.9963 5.12288L12.7058 1H3.2942L1.00371 5.12288C1.06716 6.17048 1.93641 7 3 7C4.10486 7 5 6.10486 5 5C5 4.72386 5.22386 4.5 5.5 4.5C5.77614 4.5 6 4.72386 6 5Z"
                ></path>
                <path
                    fillRule="evenodd"
                    clipRule="evenodd"
                    d="M2.5 9C2.77614 9 3 9.22386 3 9.5V15H6V11.5C6 11.2239 6.22386 11 6.5 11H9.5C9.77614 11 10 11.2239 10 11.5V15H13V9.5C13 9.22386 13.2239 9 13.5 9C13.7761 9 14 9.22386 14 9.5V15.5C14 15.7761 13.7761 16 13.5 16H2.5C2.22386 16 2 15.7761 2 15.5V9.5C2 9.22386 2.22386 9 2.5 9ZM9 15V12H7V15H9Z"
                ></path>
            </svg>
            {alt ? <span className="sr-only">{alt}</span> : null}
        </>
    );
};
