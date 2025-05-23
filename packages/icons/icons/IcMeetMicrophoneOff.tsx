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

export const IcMeetMicrophoneOff = ({
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
                    d="M8.75 12.9592C7.28408 12.3659 6.25 10.9287 6.25 9.25V5.25C6.25 3.04086 8.04086 1.25 10.25 1.25C12.4591 1.25 14.25 3.04086 14.25 5.25V7.25"
                    stroke="currentColor"
                    fill="none"
                    strokeWidth="1.5"
                    strokeMiterlimit="10"
                ></path>
                <path
                    d="M2.25 9.25C2.25 11.9997 3.63723 14.4253 5.75 15.8653"
                    stroke="currentColor"
                    fill="none"
                    strokeWidth="1.5"
                    strokeMiterlimit="10"
                ></path>
                <path
                    d="M10.25 17.25C14.6683 17.25 18.25 13.6683 18.25 9.25"
                    stroke="currentColor"
                    fill="none"
                    strokeWidth="1.5"
                    strokeMiterlimit="10"
                    strokeLinecap="square"
                ></path>
                <path
                    d="M10.25 17.25V21.25"
                    stroke="currentColor"
                    fill="none"
                    strokeWidth="1.5"
                    strokeMiterlimit="10"
                    strokeLinecap="square"
                ></path>
                <path
                    d="M6.25 21.25H14.25"
                    stroke="currentColor"
                    fill="none"
                    strokeWidth="1.5"
                    strokeMiterlimit="10"
                    strokeLinecap="square"
                ></path>
                <path
                    d="M19.25 2.25L1.25 20.25"
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
