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

export const IcFilingCabinet = ({
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
                    d="M4 2h8a1 1 0 0 1 1 1v4.5H3V3a1 1 0 0 1 1-1ZM2 8V3a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V8Zm11 .5V13a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V8.5h10ZM11 5a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1v-.5a.5.5 0 0 1 1 0V5h4v-.5a.5.5 0 0 1 1 0V5Zm-1 7a1 1 0 0 0 1-1v-.5a.5.5 0 0 0-1 0v.5H6v-.5a.5.5 0 0 0-1 0v.5a1 1 0 0 0 1 1h4Z"
                ></path>
            </svg>
            {alt ? <span className="sr-only">{alt}</span> : null}
        </>
    );
};
