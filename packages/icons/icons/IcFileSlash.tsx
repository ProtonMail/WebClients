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

export const IcFileSlash = ({ alt, title, size = 4, className = '', viewBox = '0 0 16 16', ...rest }: IconProps) => {
    return (
        <>
            {/* eslint-disable-next-line jsx-a11y/prefer-tag-over-role */}
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
                    d="M0.853553 0.146447C0.658291 -0.0488155 0.341709 -0.0488155 0.146447 0.146447C-0.0488155 0.341709 -0.0488155 0.658291 0.146447 0.853553L15.1464 15.8536C15.3417 16.0488 15.6583 16.0488 15.8536 15.8536C16.0488 15.6583 16.0488 15.3417 15.8536 15.1464L14.7231 14.016C14.899 13.7182 15 13.3709 15 13V6.5L9.5 1H3C2.6291 1 2.28177 1.10096 1.98402 1.27691L0.853553 0.146447ZM2.74098 2.03387L13.9661 13.259C13.9882 13.1764 14 13.0896 14 13V7H11C9.89543 7 9 6.10457 9 5V2H3C2.91042 2 2.82359 2.01178 2.74098 2.03387ZM13.0858 6L10 2.91421V5C10 5.55228 10.4477 6 11 6H13.0858Z"
                ></path>
                <path d="M1 13V3.81421L2 4.81421V13C2 13.5523 2.44772 14 3 14H11.1858L12.1858 15H3C1.89543 15 1 14.1046 1 13Z"></path>
            </svg>
            {alt ? <span className="sr-only">{alt}</span> : null}
        </>
    );
};
