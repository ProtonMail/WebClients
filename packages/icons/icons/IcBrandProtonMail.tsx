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

export const IcBrandProtonMail = ({
    alt,
    title,
    size = 4,
    className = '',
    viewBox = '0 0 16 16',
    ...rest
}: IconProps) => {
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
                    d="M1 2.604a.75.75 0 0 1 1.28-.53L8 7.792l5.72-5.72a.75.75 0 0 1 1.28.53V11a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V2.604ZM7.283 8.49 2 3.207v2.086l3.866 3.866a.5.5 0 0 0 .697.01l.72-.68ZM2 6.707V11a1 1 0 0 0 1 1h8V6.207L8.354 8.854l-.01.01L7.25 9.896a1.5 1.5 0 0 1-2.09-.03L2 6.707Zm10-1.5V12h1a1 1 0 0 0 1-1V3.207l-2 2Z"
                ></path>
            </svg>
            {alt ? <span className="sr-only">{alt}</span> : null}
        </>
    );
};
