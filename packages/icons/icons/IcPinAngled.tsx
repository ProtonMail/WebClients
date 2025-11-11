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

export const IcPinAngled = ({ alt, title, size = 4, className = '', viewBox = '0 0 16 16', ...rest }: IconProps) => {
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
                    d="m9.134 12.437 1.747-4.66a2.22 2.22 0 0 1 2.08-1.44h.192L9.662 2.845v.193a2.22 2.22 0 0 1-1.441 2.08L3.56 6.863l5.573 5.573Zm-.28 1.135a.61.61 0 0 0 1.004-.217l1.96-5.226a1.22 1.22 0 0 1 1.142-.792h1.134a.61.61 0 0 0 .431-1.042L9.704 1.473a.61.61 0 0 0-1.042.432v1.133c0 .509-.316.964-.793 1.143L2.644 6.14a.61.61 0 0 0-.218 1.003l2.75 2.75-3.422 3.421a.61.61 0 1 0 .863.864l3.422-3.422 2.816 2.815Z"
                ></path>
            </svg>
            {alt ? <span className="sr-only">{alt}</span> : null}
        </>
    );
};
