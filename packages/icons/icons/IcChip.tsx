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

export const IcChip = ({ alt, title, size = 4, className = '', viewBox = '0 0 16 16', ...rest }: IconProps) => {
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
                    d="M6 0.5C6.27614 0.5 6.5 0.723858 6.5 1V2.5H9.5V1C9.5 0.723858 9.72386 0.5 10 0.5C10.2761 0.5 10.5 0.723858 10.5 1V2.5H12C12.8284 2.5 13.5 3.17157 13.5 4V5.5H15C15.2761 5.5 15.5 5.72386 15.5 6C15.5 6.27614 15.2761 6.5 15 6.5H13.5V9.5H15C15.2761 9.5 15.5 9.72386 15.5 10C15.5 10.2761 15.2761 10.5 15 10.5H13.5V12C13.5 12.8284 12.8284 13.5 12 13.5H10.5V15C10.5 15.2761 10.2761 15.5 10 15.5C9.72386 15.5 9.5 15.2761 9.5 15V13.5H6.5V15C6.5 15.2761 6.27614 15.5 6 15.5C5.72386 15.5 5.5 15.2761 5.5 15V13.5H4C3.17157 13.5 2.5 12.8284 2.5 12V10.5H1C0.723858 10.5 0.5 10.2761 0.5 10C0.5 9.72386 0.723858 9.5 1 9.5H2.5V6.5H1C0.723858 6.5 0.5 6.27614 0.5 6C0.5 5.72386 0.723858 5.5 1 5.5H2.5V4C2.5 3.17157 3.17157 2.5 4 2.5H5.5V1C5.5 0.723858 5.72386 0.5 6 0.5ZM4 3.5C3.72386 3.5 3.5 3.72386 3.5 4V12C3.5 12.2761 3.72386 12.5 4 12.5H12C12.2761 12.5 12.5 12.2761 12.5 12V4C12.5 3.72386 12.2761 3.5 12 3.5H4Z"
                ></path>
                <path
                    fillRule="evenodd"
                    clipRule="evenodd"
                    d="M5.5 7C5.5 6.17157 6.17157 5.5 7 5.5H9C9.82843 5.5 10.5 6.17157 10.5 7V9C10.5 9.82843 9.82843 10.5 9 10.5H7C6.17157 10.5 5.5 9.82843 5.5 9V7ZM7 6.5C6.72386 6.5 6.5 6.72386 6.5 7V9C6.5 9.27614 6.72386 9.5 7 9.5H9C9.27614 9.5 9.5 9.27614 9.5 9V7C9.5 6.72386 9.27614 6.5 9 6.5H7Z"
                ></path>
            </svg>
            {alt ? <span className="sr-only">{alt}</span> : null}
        </>
    );
};
