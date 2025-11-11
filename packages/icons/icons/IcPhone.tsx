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

export const IcPhone = ({ alt, title, size = 4, className = '', viewBox = '0 0 16 16', ...rest }: IconProps) => {
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
                    d="M3.664 2.002 2.542 3.124c-.445.446-.618.999-.51 1.472 1 4.403 4.97 8.371 9.372 9.372.473.108 1.027-.065 1.472-.51l1.122-1.122.001-.002.001-.003v-.003l-.002-.002-2.029-2.029a.007.007 0 0 0-.008 0l-1.61.994a1.504 1.504 0 0 1-1.853-.216L5.011 7.588a1.503 1.503 0 0 1-.249-1.798l.967-1.726a.007.007 0 0 0-.002-.009L3.674 2.002l-.001-.001M14 12.327ZM3.664 2.002l.002-.001Zm.002-.001Zm0 0Zm7.516 12.943C6.404 13.857 2.143 9.596 1.057 4.818c-.2-.876.143-1.766.778-2.4l1.122-1.123a1.007 1.007 0 0 1 1.424 0l2.053 2.053c.32.319.387.81.167 1.204l-.966 1.727a.503.503 0 0 0 .083.602l3.487 3.487a.503.503 0 0 0 .62.072l1.61-.994a1.007 1.007 0 0 1 1.241.144l2.03 2.029c.392.393.392 1.03 0 1.424l-1.123 1.122c-.635.635-1.525.978-2.4.779Z"
                ></path>
            </svg>
            {alt ? <span className="sr-only">{alt}</span> : null}
        </>
    );
};
