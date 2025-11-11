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

export const IcFileLines = ({ alt, title, size = 4, className = '', viewBox = '0 0 16 16', ...rest }: IconProps) => {
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
                    d="M13 6h-2.5A1.5 1.5 0 0 1 9 4.5V2H4a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1V6Zm-3-3.586L12.586 5H10.5a.5.5 0 0 1-.5-.5V2.414ZM4 1a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V5.828a2 2 0 0 0-.586-1.414l-2.828-2.828A2 2 0 0 0 9.172 1H4Zm1 6a.5.5 0 0 0 0 1h5.5a.5.5 0 0 0 0-1H5Zm-.5 2.5A.5.5 0 0 1 5 9h3.5a.5.5 0 0 1 0 1H5a.5.5 0 0 1-.5-.5ZM5 11a.5.5 0 0 0 0 1h5.5a.5.5 0 0 0 0-1H5Z"
                ></path>
            </svg>
            {alt ? <span className="sr-only">{alt}</span> : null}
        </>
    );
};
