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

export const IcPassWork = ({ alt, title, size = 4, className = '', viewBox = '0 0 16 16', ...rest }: IconProps) => {
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
                    d="M5.5 0C5.22386 0 5 0.223858 5 0.5V3H1.5C1.10218 3 0.720644 3.15804 0.43934 3.43934C0.158035 3.72064 0 4.10218 0 4.5V9.5C0 9.77614 0.223858 10 0.5 10H6V11.5C6 11.7761 6.22386 12 6.5 12H9.5C9.77614 12 10 11.7761 10 11.5V10H15.5C15.7761 10 16 9.77614 16 9.5V4.5C16 4.10218 15.842 3.72064 15.5607 3.43934C15.2794 3.15804 14.8978 3 14.5 3H11V0.5C11 0.223858 10.7761 0 10.5 0H5.5ZM10 9H15V4.5C15 4.36739 14.9473 4.24021 14.8536 4.14645C14.7598 4.05268 14.6326 4 14.5 4H1.5C1.36739 4 1.24021 4.05268 1.14645 4.14645C1.05268 4.24021 1 4.36739 1 4.5V9H6V7.5C6 7.22386 6.22386 7 6.5 7H9.5C9.77614 7 10 7.22386 10 7.5V9ZM7 11H9V8H7V11ZM10 3V1H6V3H10Z"
                ></path>
                <path d="M1.5 11C1.77614 11 2 11.2239 2 11.5V13.5C2 13.6326 2.05268 13.7598 2.14645 13.8536C2.24021 13.9473 2.36739 14 2.5 14H13.5C13.6326 14 13.7598 13.9473 13.8536 13.8536C13.9473 13.7598 14 13.6326 14 13.5V11.5C14 11.2239 14.2239 11 14.5 11C14.7761 11 15 11.2239 15 11.5V13.5C15 13.8978 14.842 14.2794 14.5607 14.5607C14.2794 14.842 13.8978 15 13.5 15H2.5C2.10217 15 1.72064 14.842 1.43934 14.5607C1.15804 14.2794 1 13.8978 1 13.5V11.5C1 11.2239 1.22386 11 1.5 11Z"></path>
            </svg>
            {alt ? <span className="sr-only">{alt}</span> : null}
        </>
    );
};
