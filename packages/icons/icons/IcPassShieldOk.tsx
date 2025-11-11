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

export const IcPassShieldOk = ({ alt, title, size = 4, className = '', viewBox = '0 0 16 16', ...rest }: IconProps) => {
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

                <path d="M10.7494 5.94391C10.9025 5.71414 10.8404 5.40371 10.6107 5.25053C10.3809 5.09736 10.0705 5.15944 9.91731 5.38921L7.58895 8.88174L6.35355 7.64634C6.15829 7.45108 5.84171 7.45108 5.64645 7.64634C5.45118 7.8416 5.45118 8.15818 5.64645 8.35344L7.31311 10.0201C7.41904 10.126 7.56687 10.1789 7.71594 10.1641C7.865 10.1494 7.9996 10.0685 8.08269 9.94391L10.7494 5.94391Z"></path>
                <path
                    fillRule="evenodd"
                    clipRule="evenodd"
                    d="M8.85436 1.27942C8.30246 1.07873 7.69754 1.07873 7.14564 1.27942L2.32913 3.03088C2.13153 3.10274 2 3.29053 2 3.50078V9.12625C2 10.773 2.89949 12.2882 4.34517 13.0768L7.76057 14.9397C7.90981 15.0211 8.09019 15.0211 8.23943 14.9397L11.6548 13.0768C13.1005 12.2882 14 10.773 14 9.12625V3.50078C14 3.29053 13.8685 3.10274 13.6709 3.03088L8.85436 1.27942ZM7.48739 2.21922C7.81852 2.0988 8.18148 2.0988 8.51261 2.21922L13 3.85099V9.12625C13 10.4071 12.3004 11.5856 11.176 12.1989L8 13.9312L4.82402 12.1989C3.6996 11.5856 3 10.4071 3 9.12625V3.85099L7.48739 2.21922Z"
                ></path>
            </svg>
            {alt ? <span className="sr-only">{alt}</span> : null}
        </>
    );
};
