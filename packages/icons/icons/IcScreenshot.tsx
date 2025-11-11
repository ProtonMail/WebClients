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

export const IcScreenshot = ({ alt, title, size = 4, className = '', viewBox = '0 0 16 16', ...rest }: IconProps) => {
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
                    d="M8.492 1.326a.5.5 0 0 0-.073.007H5.5c-.822 0-1.5.678-1.5 1.5v10.334c0 .822.678 1.5 1.5 1.5h5c.822 0 1.5-.678 1.5-1.5V2.833c0-.822-.678-1.5-1.5-1.5H8.582a.5.5 0 0 0-.09-.007ZM5.5 2.333H8v.834a.5.5 0 1 0 1 0v-.834h1.5c.282 0 .5.218.5.5v10.334c0 .282-.218.5-.5.5h-5a.492.492 0 0 1-.5-.5V9h.833a.5.5 0 1 0 0-1H5V2.833c0-.282.218-.5.5-.5Zm2.992 1.993A.5.5 0 0 0 8 4.833v1a.5.5 0 1 0 1 0v-1a.5.5 0 0 0-.508-.507Z"
                ></path>
                <path d="M8.14 7.144a.5.5 0 0 1 .86.355V8h.5a.5.5 0 1 1 0 1H9v.5a.5.5 0 1 1-1 0V9h-.5a.5.5 0 1 1 0-1H8v-.5a.5.5 0 0 1 .14-.355Z"></path>
            </svg>
            {alt ? <span className="sr-only">{alt}</span> : null}
        </>
    );
};
