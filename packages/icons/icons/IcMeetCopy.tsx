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

export const IcMeetCopy = ({ alt, title, size = 4, className = '', viewBox = '0 0 16 16', ...rest }: IconProps) => {
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
                    d="M6.8802 0.22857C5.7419 0.22857 4.78571 1.18476 4.78571 2.32308V3.65715H5.94286V2.32308C5.94286 1.80337 6.40306 1.34286 6.8802 1.34286H13.6571C14.2857 1.34286 14.9714 2.02857 14.9714 2.65715V9.31429C14.9714 9.94286 14.2857 10.6286 13.6571 10.6286H12.4571V11.8286H13.6571C14.8571 11.8286 15.8857 10.8 15.8857 9.6V2.65715C15.8857 1.45715 14.8571 0.42857 13.6571 0.42857H6.8802ZM1.37143 7.08572C1.37143 6.45715 1.94286 5.88572 2.57143 5.88572H8.74286C9.37143 5.88572 9.94286 6.45715 9.94286 7.08572V13.7143C9.94286 14.3429 9.37143 14.9143 8.74286 14.9143H2.57143C1.94286 14.9143 1.37143 14.3429 1.37143 13.7143V7.08572ZM0.22857 7.08572C0.22857 5.88572 1.25714 4.85715 2.45714 4.85715H8.74286C9.94286 4.85715 10.9714 5.88572 10.9714 7.08572V13.7143C10.9714 14.9143 9.94286 15.9429 8.74286 15.9429H2.45714C1.25714 15.9429 0.22857 14.9143 0.22857 13.7143V7.08572Z"
                    fill="none"
                    stroke="currentColor"
                ></path>
            </svg>
            {alt ? <span className="sr-only">{alt}</span> : null}
        </>
    );
};
