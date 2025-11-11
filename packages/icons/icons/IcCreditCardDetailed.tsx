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

export const IcCreditCardDetailed = ({
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
                    d="M0.25 3.5C0.25 3.08579 0.585786 3.25 1 3.25H15C15.4142 3.25 15.75 3.58579 15.75 4V12.5C15.75 12.9142 15.4142 13.25 15 13.25H1C0.585786 13.25 0.25 12.9142 0.25 12.5V4Z"
                    fill="#EAE7E4"
                    stroke="#EAE7E4"
                ></path>
                <rect x="1.5" y="10" width="2.5" height="1.5" rx="0.75" fill="#ADABA8"></rect>
                <rect x="5" y="10" width="2.5" height="1.5" rx="0.75" fill="#ADABA8"></rect>
                <rect x="8.5" y="10" width="2.5" height="1.5" rx="0.75" fill="#ADABA8"></rect>
                <rect x="12" y="10" width="2.5" height="1.5" rx="0.75" fill="#ADABA8"></rect>
                <rect x="1.5" y="6" width="3" height="2.5" rx="0.5" fill="white"></rect>
            </svg>
            {alt ? <span className="sr-only">{alt}</span> : null}
        </>
    );
};
