/*
 * This file is auto-generated. Do not modify it manually!
 */
import React from 'react';

import type { IconSize } from '../types';

interface IconProps extends Omit<React.SVGProps<SVGSVGElement>, 'ref'> {
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

export const IcMeetSpeakerAlt = React.forwardRef<SVGSVGElement, IconProps>(function IcMeetSpeakerAlt(
    { alt, title, size = 4, className = '', viewBox = '0 0 16 16', ...rest },
    ref
) {
    return (
        <>
            <svg
                ref={ref}
                viewBox={viewBox}
                className={`icon-size-${size} ${className}`}
                role="img"
                focusable="false"
                aria-hidden="true"
                {...rest}
            >
                {title ? <title>{title}</title> : null}

                <path
                    d="M5.5 5.5H0.5V11.5H5.5L11.5 15.5V1.5L5.5 5.5Z"
                    strokeWidth="1.33"
                    strokeMiterlimit="10"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                ></path>
                <path
                    d="M14 4.93C14.926 5.837 15.5 7.102 15.5 8.5C15.5 9.863 14.955 11.098 14.07 12"
                    strokeWidth="1.33"
                    strokeMiterlimit="10"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                ></path>
            </svg>
            {alt ? <span className="sr-only">{alt}</span> : null}
        </>
    );
});
