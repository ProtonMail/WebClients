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

export const IcMeetShield = ({ alt, title, size = 4, className = '', viewBox = '0 0 16 16', ...rest }: IconProps) => {
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

                <path d="M8.83374 1.5V14.833H7.49976V1.5H8.83374Z" fill="currentColor"></path>
                <path d="M14.1028 7.5V8.83398H2.23071V7.5H14.1028Z" fill="currentColor"></path>
                <path
                    d="M8.53613 0.945312C10.4147 2.19769 12.9497 2.83293 14.833 2.83301H15.5V3.5C15.5 8.33521 13.4203 13.3073 8.42969 15.4463L8.16699 15.5586L7.9043 15.4463C2.91348 13.3074 0.833008 8.33529 0.833008 3.5V2.83301H1.5C3.38334 2.83301 5.91821 2.19776 7.79688 0.945312L8.16699 0.699219L8.53613 0.945312ZM8.16602 2.28809C6.32516 3.40604 4.06311 4.0197 2.18066 4.1416C2.35219 8.31593 4.21194 12.2716 8.16602 14.1006C12.1208 12.2719 13.9808 8.3163 14.1523 4.1416C12.2696 4.01963 10.0069 3.40635 8.16602 2.28809Z"
                    fill="currentColor"
                ></path>
            </svg>
            {alt ? <span className="sr-only">{alt}</span> : null}
        </>
    );
};
