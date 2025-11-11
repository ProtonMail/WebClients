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

export const IcMap = ({ alt, title, size = 4, className = '', viewBox = '0 0 16 16', ...rest }: IconProps) => {
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
                    d="M14.763 1.075A.5.5 0 0 1 15 1.5v11a.5.5 0 0 1-.276.447l-4 2a.5.5 0 0 1-.448 0L6.5 13.06l-3.776 1.888A.5.5 0 0 1 2 14.5v-11a.5.5 0 0 1 .276-.447l4-2a.5.5 0 0 1 .448 0L10.5 2.94l3.776-1.888a.5.5 0 0 1 .487.022ZM10 3.809l-3-1.5v9.882l3 1.5V3.809Zm1 9.882 3-1.5V2.309l-3 1.5v9.882Zm-5-1.5V2.309l-3 1.5v9.882l3-1.5Z"
                ></path>
            </svg>
            {alt ? <span className="sr-only">{alt}</span> : null}
        </>
    );
};
