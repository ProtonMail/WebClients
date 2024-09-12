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

export const IcPassBox = ({ alt, title, size = 4, className = '', viewBox = '0 0 16 16', ...rest }: IconProps) => {
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
                    clipRule="evenodd"
                    d="M8.69696 0.0404275C8.57119 -0.0134758 8.42881 -0.0134758 8.30304 0.0404275L1.30304 3.04043C1.25661 3.06033 1.2143 3.08673 1.17699 3.11831C1.14623 3.14431 1.11837 3.17426 1.09426 3.2078C1.04191 3.28051 1.00919 3.3671 1.00167 3.45912C1.00058 3.47234 1.00003 3.48554 1 3.49871C1 3.49914 1 3.49957 1 3.5V12.5C1 12.7 1.1192 12.8808 1.30304 12.9596L8.29503 15.9561C8.35398 15.9827 8.419 15.9981 8.48743 15.9998C8.49162 15.9999 8.49581 16 8.5 16C8.49996 16 8.50004 16 8.5 16C8.57467 16 8.64564 15.9836 8.70927 15.9543L15.697 12.9596C15.8808 12.8808 16 12.7 16 12.5V3.51573C16.0023 3.44491 15.9895 3.37248 15.9597 3.30305C15.9061 3.17795 15.8075 3.08595 15.6909 3.03783L8.69696 0.0404275ZM14.2308 3.50003L8.5 1.04398L2.76935 3.49998L8.50013 5.95602L14.2308 3.50003ZM2 4.25822V12.1703L8.00013 14.7418V6.8297L2 4.25822ZM9.00013 14.7417L15 12.1703V4.25833L9.00013 6.8297V14.7417Z"
                ></path>
            </svg>
            {alt ? <span className="sr-only">{alt}</span> : null}
        </>
    );
};
