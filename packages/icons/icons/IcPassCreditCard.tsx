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

export const IcPassCreditCard = ({
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

                <path d="M3.5 10C3.22386 10 3 10.2239 3 10.5C3 10.7761 3.22386 11 3.5 11H6.5C6.77614 11 7 10.7761 7 10.5C7 10.2239 6.77614 10 6.5 10H3.5Z"></path>
                <path d="M11.5 10C11.2239 10 11 10.2239 11 10.5C11 10.7761 11.2239 11 11.5 11H12.5C12.7761 11 13 10.7761 13 10.5C13 10.2239 12.7761 10 12.5 10H11.5Z"></path>
                <path
                    fillRule="evenodd"
                    clipRule="evenodd"
                    d="M0 3.5C0 2.67186 0.671858 2 1.5 2H14.5C15.3281 2 16 2.67186 16 3.5V12.5C16 13.3281 15.3281 14 14.5 14H1.5C0.671858 14 0 13.3281 0 12.5V3.5ZM1 3.5C1 3.22414 1.22414 3 1.5 3H14.5C14.7759 3 15 3.22414 15 3.5V6H1V3.5ZM15 7V12.5C15 12.7759 14.7759 13 14.5 13H1.5C1.22414 13 1 12.7759 1 12.5V7H15Z"
                ></path>
            </svg>
            {alt ? <span className="sr-only">{alt}</span> : null}
        </>
    );
};
