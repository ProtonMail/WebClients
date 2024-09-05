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

export const IcSun = ({ alt, title, size = 4, className = '', viewBox = '0 0 16 16', ...rest }: IconProps) => {
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

                <path d="M9 1.5a.5.5 0 0 0-1 0V3a.5.5 0 0 0 1 0V1.5Z"></path>
                <path d="M13.854 3.146a.5.5 0 0 0-.708 0l-1 1a.5.5 0 0 0 .708.708l1-1a.5.5 0 0 0 0-.708Z"></path>
                <path d="M14 8a.5.5 0 0 0 0 1h1.5a.5.5 0 0 0 0-1H14Z"></path>
                <path d="M12.854 12.146a.5.5 0 0 0-.708.708l1 1a.5.5 0 0 0 .708-.708l-1-1Z"></path>
                <path d="M3.854 3.146a.5.5 0 1 0-.708.708l1 1a.5.5 0 1 0 .708-.708l-1-1Z"></path>
                <path d="M1.5 8a.5.5 0 0 0 0 1H3a.5.5 0 0 0 0-1H1.5Z"></path>
                <path d="M4.854 12.854a.5.5 0 0 0-.708-.708l-1 1a.5.5 0 0 0 .708.708l1-1Z"></path>
                <path
                    fillRule="evenodd"
                    d="M8.5 4a4.5 4.5 0 1 0 0 9 4.5 4.5 0 0 0 0-9ZM5 8.5a3.5 3.5 0 1 1 7 0 3.5 3.5 0 0 1-7 0Z"
                ></path>
                <path d="M8.5 13.5a.5.5 0 0 1 .5.5v1.5a.5.5 0 0 1-1 0V14a.5.5 0 0 1 .5-.5Z"></path>
            </svg>
            {alt ? <span className="sr-only">{alt}</span> : null}
        </>
    );
};
