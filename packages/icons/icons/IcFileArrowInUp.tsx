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

export const IcFileArrowInUp = ({
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
                    d="M4.5 2A1.5 1.5 0 0 0 3 3.5v10A1.5 1.5 0 0 0 4.5 15H6v1H4.5A2.5 2.5 0 0 1 2 13.5v-10A2.5 2.5 0 0 1 4.5 1h5.672a2.5 2.5 0 0 1 1.767.732l2.329 2.329A2.5 2.5 0 0 1 15 5.828V13.5a2.5 2.5 0 0 1-2.5 2.5H11v-1h1.5a1.5 1.5 0 0 0 1.5-1.5V6h-2c-.828 0-2-.672-2-1.5V2H4.5Zm6.5.25V4.5a.5.5 0 0 0 .5.5h2.25a1.503 1.503 0 0 0-.19-.232l-2.328-2.329A1.497 1.497 0 0 0 11 2.25ZM8.005 7.288a.7.7 0 0 1 .99 0l1.859 1.858a.5.5 0 0 1-.708.708L9 8.707V15.5a.5.5 0 0 1-1 0V8.707L6.854 9.854a.5.5 0 1 1-.708-.708l1.859-1.858Z"
                ></path>
            </svg>
            {alt ? <span className="sr-only">{alt}</span> : null}
        </>
    );
};
