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

export const IcLockOpenCheckFilled = ({
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
                    d="M7.612 2.063a2.69 2.69 0 0 1 2.723 1.003l.266.352a.5.5 0 0 0 .798-.604l-.267-.352A3.69 3.69 0 0 0 4.5 4.69v.317c-.675.01-1.08.048-1.408.215a2 2 0 0 0-.874.874C2 6.524 2 7.084 2 8.204V11.8c0 1.12 0 1.68.218 2.108a2 2 0 0 0 .874.874C3.52 15 4.08 15 5.2 15h5.6c1.12 0 1.68 0 2.108-.218a2 2 0 0 0 .874-.874C14 13.48 14 12.92 14 11.8V8.204c0-1.12 0-1.68-.218-2.108a2 2 0 0 0-.874-.874c-.428-.218-.988-.218-2.108-.218H5.5V4.69a2.69 2.69 0 0 1 2.112-2.627Zm4.242 5.587a.5.5 0 0 1 0 .707l-3.86 3.857a.7.7 0 0 1-.989 0l-1.858-1.858a.5.5 0 0 1 .706-.708L7.5 11.294l3.646-3.645a.5.5 0 0 1 .708 0Z"
                ></path>
            </svg>
            {alt ? <span className="sr-only">{alt}</span> : null}
        </>
    );
};
