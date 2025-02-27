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

export const IcAlbum = ({ alt, title, size = 4, className = '', viewBox = '0 0 16 16', ...rest }: IconProps) => {
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

                <path d="M13.2449 11.643C13.4656 11.9307 13.2479 12.3333 12.8717 12.3333L5.46162 12.3333C5.08539 12.3333 4.86773 11.9307 5.08848 11.643L6.83892 9.36217C6.9493 9.21834 7.17631 9.21834 7.28669 9.36217C7.8141 10.0494 8.84982 10.0494 9.37723 9.36217L10.2119 8.27454C10.3223 8.13071 10.5493 8.13071 10.6597 8.27454L13.2449 11.643Z"></path>
                <path d="M8.75 7.33333C8.75 7.79357 8.3769 8.16667 7.91667 8.16667C7.45643 8.16667 7.08333 7.79357 7.08333 7.33333C7.08333 6.8731 7.45643 6.5 7.91667 6.5C8.3769 6.5 8.75 6.8731 8.75 7.33333Z"></path>
                <path
                    fillRule="evenodd"
                    clipRule="evenodd"
                    d="M12.6667 4L13.3333 4C14.2538 4 15 4.74619 15 5.66667L15 12.3333C15 13.2538 14.2538 14 13.3333 14L5 14C4.07953 14 3.33333 13.2538 3.33333 12.3333L3.33333 12L2.66667 12C1.74619 12 1 11.2538 1 10.3333L1 3.66667C1 2.74619 1.74619 2 2.66667 2L11 2C11.9205 2 12.6667 2.74619 12.6667 3.66667L12.6667 4ZM11 2.83333L2.66667 2.83333C2.20643 2.83333 1.83333 3.20643 1.83333 3.66667L1.83333 10.3333C1.83333 10.7936 2.20643 11.1667 2.66667 11.1667L3.33333 11.1667L3.33333 5.66667C3.33333 4.74619 4.07953 4 5 4L11.8333 4L11.8333 3.66667C11.8333 3.20643 11.4602 2.83333 11 2.83333ZM5 4.83333L13.3333 4.83333C13.7936 4.83333 14.1667 5.20643 14.1667 5.66667L14.1667 12.3333C14.1667 12.7936 13.7936 13.1667 13.3333 13.1667L5 13.1667C4.53976 13.1667 4.16667 12.7936 4.16667 12.3333L4.16667 5.66667C4.16667 5.20643 4.53976 4.83333 5 4.83333Z"
                ></path>
            </svg>
            {alt ? <span className="sr-only">{alt}</span> : null}
        </>
    );
};
