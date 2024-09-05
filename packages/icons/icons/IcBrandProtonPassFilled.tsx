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

export const IcBrandProtonPassFilled = ({
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
                    d="m13.575 6.971-4.55-4.55a1.45 1.45 0 0 0-2.05 0l4.665 4.68c.49.49.49 1.3 0 1.79l-4.665 4.681a1.45 1.45 0 0 0 2.05 0l4.55-4.55a1.45 1.45 0 0 0 0-2.05ZM9.732 1.714a2.45 2.45 0 0 0-3.464 0l-4.55 4.55a2.45 2.45 0 0 0 0 3.465l4.55 4.55a2.45 2.45 0 0 0 3.464 0l4.55-4.55a2.45 2.45 0 0 0 0-3.465l-4.55-4.55Z"
                ></path>
            </svg>
            {alt ? <span className="sr-only">{alt}</span> : null}
        </>
    );
};
