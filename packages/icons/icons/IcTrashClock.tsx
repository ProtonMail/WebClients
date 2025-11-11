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

export const IcTrashClock = ({ alt, title, size = 4, className = '', viewBox = '0 0 16 16', ...rest }: IconProps) => {
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

                <path d="M12 10a.5.5 0 0 0-1 0v1.5a.5.5 0 0 0 .146.354l1 1a.5.5 0 0 0 .708-.708L12 11.293V10Z"></path>
                <path
                    fillRule="evenodd"
                    d="M5 0a.5.5 0 0 0-.447.276L3.69 2H.5a.5.5 0 0 0 0 1h1.272l.435 9.568A1.5 1.5 0 0 0 3.706 14H7.75v-.012a4.5 4.5 0 1 0 3.525-6.983l.2-4.005H12.5a.5.5 0 0 0 0-1H9.309L8.447.276A.5.5 0 0 0 8 0H5Zm2 11.5c0 .526.09 1.03.256 1.5h-3.55a.5.5 0 0 1-.5-.477L2.773 3h7.701l-.208 4.171A4.502 4.502 0 0 0 7 11.5ZM8.191 2l-.5-1H5.309l-.5 1h3.382ZM11.5 8a3.5 3.5 0 1 0 0 7 3.5 3.5 0 0 0 0-7Z"
                    clipRule="evenodd"
                ></path>
            </svg>
            {alt ? <span className="sr-only">{alt}</span> : null}
        </>
    );
};
