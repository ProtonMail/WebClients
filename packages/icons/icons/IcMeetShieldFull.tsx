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

export const IcMeetShieldFull = ({
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

                <path d="M14.856 3.12505C12.6407 2.87816 10.5655 1.91847 8.94267 0.390382C8.69263 0.140421 8.35355 0 8 0C7.64645 0 7.30737 0.140421 7.05733 0.390382C5.43452 1.91847 3.35931 2.87816 1.144 3.12505C0.826628 3.17058 0.53629 3.32894 0.326184 3.57113C0.116079 3.81331 0.000277886 4.12309 0 4.44372C0 4.78905 0.0853329 12.937 7.504 15.9104C7.82262 16.0366 8.17738 16.0366 8.496 15.9104C15.9147 12.933 16 4.78905 16 4.44372C15.9997 4.12309 15.8839 3.81331 15.6738 3.57113C15.4637 3.32894 15.1734 3.17058 14.856 3.12505Z"></path>
            </svg>
            {alt ? <span className="sr-only">{alt}</span> : null}
        </>
    );
};
