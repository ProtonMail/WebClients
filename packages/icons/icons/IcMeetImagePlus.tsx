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

export const IcMeetImagePlus = ({
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

                <path d="M10.8622 6.8623C11.1226 6.6019 11.5441 6.6019 11.8045 6.8623C12.0648 7.1226 12.0648 7.5441 11.8045 7.8044L8.4716 11.138C8.237 11.3726 7.8652 11.3988 7.5998 11.1998L5.3951 9.5466L3.8044 11.138C3.5441 11.3982 3.1226 11.3982 2.8623 11.138C2.6019 10.8777 2.6019 10.4554 2.8623 10.195L4.8623 8.195L4.956 8.117C5.1879 7.9576 5.5012 7.9592 5.7334 8.1334L7.9373 9.7865L10.8622 6.8623Z"></path>
                <path d="M14.0002 8.6666V1.333H1.333V14.0002H8.6666C9.0348 14.0002 9.333 14.2984 9.333 14.6666C9.333 15.0348 9.0348 15.333 8.6666 15.333H0.6666C0.2984 15.333 0.0002 15.0348 0.0002 14.6666V0.6666C0.0002 0.2984 0.2984 0.0002 0.6666 0.0002H14.6666C15.0348 0.0002 15.333 0.2984 15.333 0.6666V8.6666C15.333 9.0348 15.0348 9.333 14.6666 9.333C14.2984 9.333 14.0002 9.0348 14.0002 8.6666Z"></path>
                <path d="M6.6666 4.667C6.6666 4.2989 6.3683 3.9999 6.0002 3.9998C5.632 3.9998 5.333 4.2988 5.333 4.667C5.3332 5.0351 5.6321 5.3334 6.0002 5.3334C6.3682 5.3333 6.6665 5.035 6.6666 4.667ZM8.0002 4.667C8.0001 5.7714 7.1046 6.6668 6.0002 6.667C4.8957 6.667 4.0003 5.7714 4.0002 4.667C4.0002 3.5624 4.8956 2.667 6.0002 2.667C7.1046 2.6671 8.0002 3.5625 8.0002 4.667Z"></path>
                <path d="M13.3338 10.6666C13.7018 10.6668 14.0002 10.9658 14.0002 11.3338V12.6674H15.3338C15.7018 12.6676 16.0002 12.9658 16.0002 13.3338C16 13.7017 15.7017 14 15.3338 14.0002H14.0002V15.3338C14 15.7017 13.7017 16 13.3338 16.0002C12.9658 16.0002 12.6676 15.7018 12.6674 15.3338V14.0002H11.3338C10.9658 14.0002 10.6668 13.7018 10.6666 13.3338C10.6666 12.9656 10.9656 12.6674 11.3338 12.6674H12.6674V11.3338C12.6674 10.9656 12.9656 10.6666 13.3338 10.6666Z"></path>
            </svg>
            {alt ? <span className="sr-only">{alt}</span> : null}
        </>
    );
};
