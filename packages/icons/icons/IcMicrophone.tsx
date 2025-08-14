/*
 * This file is auto-generated. Do not modify it manually!
 * Run 'yarn workspace @proton/icons build' to update the icons react components.
 */
import React from 'react';

import type {IconSize} from '../types';

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

export const IcMicrophone = ({alt, title, size = 4, className = '', viewBox = '0 0 16 16', ...rest}: IconProps) => {
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

                <path fillRule="evenodd" clipRule="evenodd"
                      d="M10 7.84211V4.15789C10 2.99519 9.10457 2.05263 8 2.05263C6.89543 2.05263 6 2.99519 6 4.15789V7.84211C6 9.00481 6.89543 9.94737 8 9.94737C9.10457 9.94737 10 9.00481 10 7.84211ZM8 1C6.34315 1 5 2.41384 5 4.15789V7.84211C5 9.58616 6.34315 11 8 11C9.65685 11 11 9.58616 11 7.84211V4.15789C11 2.41384 9.65685 1 8 1Z"/>
                <path fillRule="evenodd" clipRule="evenodd"
                      d="M3.5 7C3.77614 7 4 7.22386 4 7.5V8.19048C4 10.3996 5.79086 12.1905 8 12.1905C10.2091 12.1905 12 10.3996 12 8.19048V7.5C12 7.22386 12.2239 7 12.5 7C12.7761 7 13 7.22386 13 7.5V8.19048C13 10.7831 11.0267 12.9149 8.5 13.1658V14.5C8.5 14.7761 8.27614 15 8 15C7.72386 15 7.5 14.7761 7.5 14.5V13.1658C4.97334 12.9149 3 10.7831 3 8.19048V7.5C3 7.22386 3.22386 7 3.5 7Z"/>
            </svg>
            {alt ? <span className="sr-only">{alt}</span> : null}
        </>
    );
};
