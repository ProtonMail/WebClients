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

export const IcMeetMicrophoneFilled = ({
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
                    d="M8 10C10.2 10 12 8.2 12 6V4C12 1.8 10.2 0 8 0C5.8 0 4 1.8 4 4V6C4 8.2 5.8 10 8 10Z"
                    stroke="currentColor"
                    fill="currentColor"
                ></path>
                <path
                    d="M15.9 7.0998C16 6.5998 15.6 6.0998 15.1 5.9998C14.6 5.8998 14 6.2998 14 6.7998C13.5 9.7998 11 11.9998 8.00002 11.9998C5.00002 11.9998 2.50002 9.7998 2.10002 6.8998C2.00002 6.2998 1.50002 5.8998 0.900021 5.9998C0.400021 6.0998 2.08467e-05 6.5998 0.100021 7.0998C0.600021 10.6998 3.50002 13.3998 7.00002 13.8998V15.9998H9.00002V13.8998C12.5 13.4998 15.4 10.6998 15.9 7.0998Z"
                    stroke="currentColor"
                    fill="currentColor"
                ></path>
            </svg>
            {alt ? <span className="sr-only">{alt}</span> : null}
        </>
    );
};
