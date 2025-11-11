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

export const IcBrandMastercard = ({
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
                    d="M13 4H3a1 1 0 0 0-1 1v6a1 1 0 0 0 1 1h10a1 1 0 0 0 1-1V5a1 1 0 0 0-1-1ZM3 3a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2H3Z"
                ></path>
                <path d="M6.5 5.5c.45 0 .87.119 1.235.326A2.795 2.795 0 0 0 6.7 8c0 .877.404 1.66 1.035 2.174A2.5 2.5 0 1 1 6.5 5.5Z"></path>
                <path d="M7 8c0-.818.393-1.544 1-2 .607.456 1 1.182 1 2 0 .818-.393 1.544-1 2a2.496 2.496 0 0 1-1-2Z"></path>
                <path d="M9.3 8c0 .877-.404 1.66-1.035 2.174a2.5 2.5 0 1 0 0-4.348A2.795 2.795 0 0 1 9.3 8Z"></path>
            </svg>
            {alt ? <span className="sr-only">{alt}</span> : null}
        </>
    );
};
