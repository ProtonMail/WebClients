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

export const IcMeetChat = ({ alt, title, size = 4, className = '', viewBox = '0 0 16 16', ...rest }: IconProps) => {
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
                    d="M21.25 1.25H3.25C2.145 1.25 1.25 2.145 1.25 3.25V14.25C1.25 15.355 2.145 16.25 3.25 16.25H8.25L12.25 21.25L16.25 16.25H21.25C22.355 16.25 23.25 15.355 23.25 14.25V3.25C23.25 2.145 22.355 1.25 21.25 1.25Z"
                    strokeWidth="1.5"
                    strokeMiterlimit="10"
                    strokeLinecap="square"
                    stroke="currentColor"
                    fill="none"
                ></path>
                <path
                    d="M7.25 6.25H17.25"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeMiterlimit="10"
                    strokeLinecap="square"
                ></path>
                <path
                    d="M7.25 11.25H13.25"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeMiterlimit="10"
                    strokeLinecap="square"
                ></path>
            </svg>
            {alt ? <span className="sr-only">{alt}</span> : null}
        </>
    );
};
