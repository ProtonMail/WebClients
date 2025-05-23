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

export const IcMeetParticipants = ({
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
                    d="M15.75 6.75C17.2688 6.75 18.5 5.51878 18.5 4C18.5 2.48122 17.2688 1.25 15.75 1.25C14.2312 1.25 13 2.48122 13 4C13 5.51878 14.2312 6.75 15.75 6.75Z"
                    stroke="white"
                    strokeWidth="1.5"
                    strokeMiterlimit="10"
                    strokeLinecap="square"
                    fill="none"
                ></path>
                <path
                    d="M14.803 15.75H21.225C21.24 15.585 21.25 15.419 21.25 15.25C21.25 12.212 18.788 9.75 15.75 9.75C14.925 9.75 14.146 9.937 13.444 10.262"
                    stroke="white"
                    strokeWidth="1.5"
                    strokeMiterlimit="10"
                    strokeLinecap="square"
                    fill="none"
                ></path>
                <path
                    d="M6.75 12.25C8.26878 12.25 9.5 11.0188 9.5 9.5C9.5 7.98122 8.26878 6.75 6.75 6.75C5.23122 6.75 4 7.98122 4 9.5C4 11.0188 5.23122 12.25 6.75 12.25Z"
                    stroke="white"
                    strokeWidth="1.5"
                    strokeMiterlimit="10"
                    strokeLinecap="square"
                    fill="none"
                ></path>
                <path
                    d="M12.225 21.25C12.24 21.085 12.25 20.919 12.25 20.75C12.25 17.712 9.788 15.25 6.75 15.25C3.712 15.25 1.25 17.712 1.25 20.75C1.25 20.919 1.26 21.085 1.275 21.25H12.225Z"
                    stroke="white"
                    strokeWidth="1.5"
                    strokeMiterlimit="10"
                    strokeLinecap="square"
                    fill="none"
                ></path>
            </svg>
            {alt ? <span className="sr-only">{alt}</span> : null}
        </>
    );
};
