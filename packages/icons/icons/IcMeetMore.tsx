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

export const IcMeetMore = ({ alt, title, size = 4, className = '', viewBox = '0 0 16 16', ...rest }: IconProps) => {
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
                    d="M14.167 8.16699C14.167 4.85339 11.4806 2.16717 8.16699 2.16699C4.85328 2.16699 2.16699 4.85328 2.16699 8.16699C2.16717 11.4806 4.85339 14.167 8.16699 14.167C11.4804 14.1668 14.1668 11.4804 14.167 8.16699ZM15.5 8.16699C15.4998 12.2168 12.2168 15.4998 8.16699 15.5C4.11701 15.5 0.833184 12.2169 0.833008 8.16699C0.833008 4.1169 4.1169 0.833008 8.16699 0.833008C12.2169 0.833184 15.5 4.11701 15.5 8.16699Z"
                    fill="currentColor"
                ></path>
                <path
                    d="M8.16659 8.99967C8.62682 8.99967 8.99992 8.62658 8.99992 8.16634C8.99992 7.7061 8.62682 7.33301 8.16659 7.33301C7.70635 7.33301 7.33325 7.7061 7.33325 8.16634C7.33325 8.62658 7.70635 8.99967 8.16659 8.99967Z"
                    fill="currentColor"
                ></path>
                <path
                    d="M4.66659 8.99967C5.12682 8.99967 5.49992 8.62658 5.49992 8.16634C5.49992 7.7061 5.12682 7.33301 4.66659 7.33301C4.20635 7.33301 3.83325 7.7061 3.83325 8.16634C3.83325 8.62658 4.20635 8.99967 4.66659 8.99967Z"
                    fill="currentColor"
                ></path>
                <path
                    d="M11.6666 8.99967C12.1268 8.99967 12.4999 8.62658 12.4999 8.16634C12.4999 7.7061 12.1268 7.33301 11.6666 7.33301C11.2063 7.33301 10.8333 7.7061 10.8333 8.16634C10.8333 8.62658 11.2063 8.99967 11.6666 8.99967Z"
                    fill="currentColor"
                ></path>
            </svg>
            {alt ? <span className="sr-only">{alt}</span> : null}
        </>
    );
};
