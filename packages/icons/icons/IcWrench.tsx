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

export const IcWrench = ({ alt, title, size = 4, className = '', viewBox = '0 0 16 16', ...rest }: IconProps) => {
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
                    d="M7.16 2.345a4.594 4.594 0 0 1 5.04-.982.51.51 0 0 1 .163.831L10.24 4.317l.24 1.203 1.203.24 2.123-2.123a.51.51 0 0 1 .83.162 4.594 4.594 0 0 1-5.125 6.298l-4.155 4.156a2.551 2.551 0 1 1-3.609-3.609L5.903 6.49A4.588 4.588 0 0 1 7.16 2.345Zm3.877-.269a3.568 3.568 0 0 0-3.155.99 3.57 3.57 0 0 0-.925 3.452.51.51 0 0 1-.132.492l-4.356 4.356a1.53 1.53 0 1 0 2.165 2.165L8.99 9.175a.51.51 0 0 1 .492-.132 3.57 3.57 0 0 0 3.451-.925 3.568 3.568 0 0 0 .991-3.155l-1.713 1.712a.51.51 0 0 1-.46.14l-1.805-.361a.51.51 0 0 1-.4-.4l-.36-1.805a.51.51 0 0 1 .139-.46l1.712-1.713Z"
                ></path>
            </svg>
            {alt ? <span className="sr-only">{alt}</span> : null}
        </>
    );
};
