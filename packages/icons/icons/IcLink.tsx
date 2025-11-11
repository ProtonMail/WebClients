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

export const IcLink = ({ alt, title, size = 4, className = '', viewBox = '0 0 16 16', ...rest }: IconProps) => {
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
                    d="M9.023 2.027a3.5 3.5 0 0 1 4.95 4.95l-2.437 2.437a.5.5 0 1 1-.707-.707l2.437-2.437A2.5 2.5 0 1 0 9.73 2.734L7.293 5.171a.5.5 0 1 1-.707-.707l2.437-2.437Zm1.098 3.852a.5.5 0 0 1 0 .707l-3.535 3.535a.5.5 0 1 1-.708-.707L9.414 5.88a.5.5 0 0 1 .707 0ZM2.03 13.97a3.5 3.5 0 0 0 4.95 0l2.44-2.439a.5.5 0 1 0-.708-.707l-2.44 2.44a2.5 2.5 0 0 1-3.535-3.536l2.44-2.44a.5.5 0 0 0-.707-.707l-2.44 2.44a3.5 3.5 0 0 0 0 4.95Z"
                ></path>
            </svg>
            {alt ? <span className="sr-only">{alt}</span> : null}
        </>
    );
};
