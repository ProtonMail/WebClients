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

export const IcPassShieldWarning = ({
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

                <path d="M7.5903 8.49648L7.2047 5.48298C7.17192 5.22678 7.37153 5 7.62982 5H8.37034C8.62862 5 8.82823 5.22676 8.79546 5.48296L8.41002 8.49646C8.38363 8.70271 8.20809 8.85724 8.00016 8.85724C7.79223 8.85724 7.61669 8.70273 7.5903 8.49648Z"></path>
                <path d="M8.65407 10.3571C8.65407 10.7121 8.36096 10.9999 7.9994 10.9999C7.63783 10.9999 7.34473 10.7121 7.34473 10.3571C7.34473 10.002 7.63783 9.71419 7.9994 9.71419C8.36096 9.71419 8.65407 10.002 8.65407 10.3571Z"></path>
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
