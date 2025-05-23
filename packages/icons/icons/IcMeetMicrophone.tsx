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

export const IcMeetMicrophone = ({
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
                    d="M13.25 9.25V5.25C13.25 3.04086 11.4591 1.25 9.25 1.25C7.04086 1.25 5.25 3.04086 5.25 5.25V9.25C5.25 11.4591 7.04086 13.25 9.25 13.25C11.4591 13.25 13.25 11.4591 13.25 9.25Z"
                    stroke="currentColor"
                    fill="none"
                    strokeWidth="1.5"
                    strokeMiterlimit="10"
                    strokeLinecap="square"
                ></path>
                <path
                    d="M17.25 9.25C17.25 13.6683 13.6683 17.25 9.25 17.25C4.83172 17.25 1.25 13.6683 1.25 9.25"
                    stroke="currentColor"
                    fill="none"
                    strokeWidth="1.5"
                    strokeMiterlimit="10"
                    strokeLinecap="square"
                ></path>
                <path
                    d="M9.25 17.25V21.25"
                    stroke="currentColor"
                    fill="none"
                    strokeWidth="1.5"
                    strokeMiterlimit="10"
                    strokeLinecap="square"
                ></path>
                <path
                    d="M5.25 21.25H13.25"
                    stroke="currentColor"
                    fill="none"
                    strokeWidth="1.5"
                    strokeMiterlimit="10"
                    strokeLinecap="square"
                ></path>
            </svg>
            {alt ? <span className="sr-only">{alt}</span> : null}
        </>
    );
};
