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

export const IcPassBasketball = ({
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
                    clipRule="evenodd"
                    d="M15 7.5C15 11.6421 11.6421 15 7.5 15C3.35786 15 0 11.6421 0 7.5C0 3.35786 3.35786 0 7.5 0C11.6421 0 15 3.35786 15 7.5ZM7 1.01894C5.49631 1.13333 4.13563 1.75935 3.09165 2.7233C4.06767 3.89966 4.6942 5.37744 4.80167 7H7V1.01894ZM2.40482 3.4636C1.62231 4.45005 1.1202 5.669 1.01894 7H3.79912C3.69718 5.66781 3.19129 4.45072 2.40482 3.4636ZM1.01894 8H3.79911C3.69706 9.33199 3.19075 10.5491 2.40473 11.5363C1.62227 10.5499 1.12019 9.33095 1.01894 8ZM3.09158 12.2766C4.13556 13.2406 5.49627 13.8667 7 13.9811V8H4.80166C4.69408 9.62268 4.06687 11.1004 3.09158 12.2766ZM8 13.9811V8H10.1986C10.3062 9.6226 10.9334 11.1003 11.9086 12.2765C10.8646 13.2406 9.50381 13.8667 8 13.9811ZM12.5954 11.5361C13.3778 10.5497 13.8798 9.33086 13.9811 8H11.2012C11.3032 9.3319 11.8095 10.5489 12.5954 11.5361ZM13.9811 7H11.2012C11.3031 5.6679 11.809 4.45088 12.5953 3.4638C13.3778 4.45021 13.8798 5.66909 13.9811 7ZM11.9085 2.72347C10.8645 1.75942 9.50378 1.13334 8 1.01894V7H10.1986C10.3061 5.37752 10.9326 3.89979 11.9085 2.72347Z"
                ></path>
            </svg>
            {alt ? <span className="sr-only">{alt}</span> : null}
        </>
    );
};
