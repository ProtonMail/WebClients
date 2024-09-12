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

export const IcPassLaptop = ({ alt, title, size = 4, className = '', viewBox = '0 0 16 16', ...rest }: IconProps) => {
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
                    d="M1 11V3.5C1 3.10218 1.15804 2.72064 1.43934 2.43934C1.72064 2.15804 2.10218 2 2.5 2H13.5C13.8978 2 14.2794 2.15804 14.5607 2.43934C14.842 2.72064 15 3.10217 15 3.5V11H15.5C15.7761 11 16 11.2239 16 11.5C16 12.163 15.7366 12.7989 15.2678 13.2678C14.7989 13.7366 14.163 14 13.5 14H2.5C1.83696 14 1.20107 13.7366 0.732233 13.2678C0.263392 12.7989 0 12.163 0 11.5C0 11.3674 0.0526784 11.2402 0.146447 11.1464C0.240215 11.0527 0.367392 11 0.5 11H1ZM2.14645 3.14645C2.24021 3.05268 2.36739 3 2.5 3H13.5C13.6326 3 13.7598 3.05268 13.8536 3.14645C13.9473 3.24021 14 3.36739 14 3.5V11H2V3.5C2 3.36739 2.05268 3.24021 2.14645 3.14645ZM1.08579 12C1.15967 12.209 1.27964 12.401 1.43934 12.5607C1.72064 12.842 2.10218 13 2.5 13H13.5C13.8978 13 14.2794 12.842 14.5607 12.5607C14.7204 12.401 14.8403 12.209 14.9142 12H1.08579Z"
                ></path>
            </svg>
            {alt ? <span className="sr-only">{alt}</span> : null}
        </>
    );
};
