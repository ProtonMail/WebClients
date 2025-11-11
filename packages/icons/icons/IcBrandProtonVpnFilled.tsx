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

export const IcBrandProtonVpnFilled = ({
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
                    d="M1.21 3.882c-.64-1.142.287-2.526 1.586-2.37l10.797 1.293a1.6 1.6 0 0 1 1.158 2.45l-5.457 8.55a1.5 1.5 0 0 1-2.573-.074l-5.512-9.85Zm1.467-1.378a.6.6 0 0 0-.595.89l.273.488 8.615 1.157c.553.075.84.7.534 1.167l-4.23 6.465.32.572a.5.5 0 0 0 .857.024l5.457-8.55a.6.6 0 0 0-.434-.919L2.677 2.504Z"
                ></path>
            </svg>
            {alt ? <span className="sr-only">{alt}</span> : null}
        </>
    );
};
