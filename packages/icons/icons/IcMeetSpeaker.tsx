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

export const IcMeetSpeaker = ({ alt, title, size = 4, className = '', viewBox = '0 0 16 16', ...rest }: IconProps) => {
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
                    d="M13.25 19.25L7.25 14.25H3.25C2.14543 14.25 1.25 13.3546 1.25 12.25V8.25C1.25 7.14543 2.14543 6.25 3.25 6.25H7.25L13.25 1.25V19.25Z"
                    stroke="currentColor"
                    fill="none"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                ></path>
                <path
                    d="M16.7854 6.71436C17.6902 7.61918 18.2499 8.86918 18.2499 10.2499C18.2499 11.6306 17.6902 12.8806 16.7854 13.7854"
                    stroke="currentColor"
                    fill="none"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                ></path>
                <path
                    d="M19.614 3.88623C21.2426 5.51491 22.25 7.76491 22.25 10.2502C22.25 12.7355 21.2426 14.9855 19.614 16.6142"
                    stroke="currentColor"
                    fill="none"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                ></path>
            </svg>
            {alt ? <span className="sr-only">{alt}</span> : null}
        </>
    );
};
