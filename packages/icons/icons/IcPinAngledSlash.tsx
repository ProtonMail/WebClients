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

export const IcPinAngledSlash = ({
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

                <path d="m9.134 12.437.387-1.032.777.777-.44 1.173a.61.61 0 0 1-1.003.217l-2.816-2.815-3.422 3.422a.61.61 0 1 1-.863-.864l3.422-3.422-2.75-2.75a.61.61 0 0 1 .218-1.002l1.173-.44.776.776-1.032.387 5.573 5.573Z"></path>
                <path
                    fillRule="evenodd"
                    d="m11.004 10.297.813-2.168a1.22 1.22 0 0 1 1.143-.792h1.134a.61.61 0 0 0 .431-1.042L9.704 1.473a.61.61 0 0 0-1.042.432v1.133c0 .509-.316.964-.793 1.143l-2.168.813-2.847-2.848a.5.5 0 1 0-.708.708l11 11a.5.5 0 0 0 .708-.708l-2.85-2.849ZM6.478 5.771l1.743-.654a2.22 2.22 0 0 0 1.44-2.08v-.192l3.492 3.492h-.193a2.22 2.22 0 0 0-2.079 1.44l-.654 1.743-3.75-3.75Z"
                ></path>
            </svg>
            {alt ? <span className="sr-only">{alt}</span> : null}
        </>
    );
};
