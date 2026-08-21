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

export const IcMeetStop = ({ alt, title, size = 4, className = '', viewBox = '0 0 16 16', ...rest }: IconProps) => {
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

                <path d="M14.6667 8.0003C14.6667 4.3185 11.6821 1.3332 8.0003 1.3331C4.3184 1.3331 1.3331 4.3184 1.3331 8.0003C1.3332 11.6821 4.3185 14.6667 8.0003 14.6667C11.682 14.6666 14.6666 11.682 14.6667 8.0003ZM16.0003 8.0003C16.0002 12.4184 12.4184 16.0002 8.0003 16.0003C3.5821 16.0003 0.0004 12.4185 0.0003 8.0003C0.0003 3.582 3.582 0.0003 8.0003 0.0003C12.4185 0.0004 16.0003 3.5821 16.0003 8.0003Z"></path>
                <path d="M10.6669 4.6669C11.035 4.667 11.3333 4.9652 11.3333 5.3333V10.6669C11.3332 11.0349 11.0349 11.3332 10.6669 11.3333H5.3333C4.9652 11.3333 4.667 11.035 4.6669 10.6669V5.3333C4.6669 4.9651 4.9651 4.6669 5.3333 4.6669H10.6669ZM5.9997 9.9997H9.9997V5.9997H5.9997V9.9997Z"></path>
            </svg>
            {alt ? <span className="sr-only">{alt}</span> : null}
        </>
    );
};
