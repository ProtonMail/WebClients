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

export const IcPinAngledFilled = ({
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

                <path d="M9.704 1.473a.61.61 0 0 0-1.042.432v1.133c0 .509-.316.964-.793 1.143L2.644 6.14a.61.61 0 0 0-.218 1.003l2.75 2.75-3.422 3.421a.61.61 0 1 0 .863.864l3.422-3.422 2.816 2.815a.61.61 0 0 0 1.003-.217l1.96-5.226a1.22 1.22 0 0 1 1.142-.792h1.134a.61.61 0 0 0 .431-1.042L9.704 1.473Z"></path>
            </svg>
            {alt ? <span className="sr-only">{alt}</span> : null}
        </>
    );
};
