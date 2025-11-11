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

export const IcInbox = ({ alt, title, size = 4, className = '', viewBox = '0 0 16 16', ...rest }: IconProps) => {
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
                    d="M1.022 8.646a2 2 0 0 1 .162-.545l2.28-4.94A2 2 0 0 1 5.28 2h5.44a2 2 0 0 1 1.816 1.162l2.28 4.94.008.017a2.001 2.001 0 0 1 .176.82V12a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8.94a2 2 0 0 1 .022-.294ZM14 9v3a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V9h2.586a.5.5 0 0 1 .353.146l.915.915a1.5 1.5 0 0 0 1.06.439h2.172a1.5 1.5 0 0 0 1.06-.44l.915-.914A.5.5 0 0 1 11.414 9H14Zm-.332-1h-2.254a1.5 1.5 0 0 0-1.06.44l-.915.914a.5.5 0 0 1-.353.146H6.914a.5.5 0 0 1-.353-.146l-.915-.915A1.5 1.5 0 0 0 4.586 8H2.332l2.04-4.42A1 1 0 0 1 5.28 3h5.44a1 1 0 0 1 .908.58L13.668 8Z"
                ></path>
            </svg>
            {alt ? <span className="sr-only">{alt}</span> : null}
        </>
    );
};
