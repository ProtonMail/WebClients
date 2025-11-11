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

export const IcStorage = ({ alt, title, size = 4, className = '', viewBox = '0 0 16 16', ...rest }: IconProps) => {
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
                    d="M4 3.5c0-.177.075-.35.266-.532.2-.19.507-.367.91-.517C5.978 2.15 7.04 2 8 2c.959 0 2.021.15 2.825.45.402.151.71.329.909.518.191.181.266.355.266.532 0 .177-.075.35-.266.532-.2.19-.507.367-.91.517C10.022 4.85 8.96 5 8 5c-.959 0-2.021-.15-2.825-.45-.402-.151-.71-.329-.909-.518C4.075 3.851 4 3.677 4 3.5Zm-1 0c0-.514.238-.935.578-1.258.332-.315.774-.551 1.247-.728C5.77 1.16 6.959 1 8 1s2.229.16 3.175.514c.473.177.915.413 1.247.728.34.323.578.744.578 1.258V12c0 .953-.685 1.712-1.57 2.205-.9.501-2.112.795-3.43.795s-2.53-.294-3.43-.795C3.684 13.712 3 12.953 3 12V3.5Zm1 4.584V9.5c0 .177.075.35.266.532.2.19.507.367.91.518.803.3 1.865.45 2.824.45.959 0 2.021-.15 2.825-.45.402-.151.71-.329.909-.518.191-.181.266-.355.266-.532V8.084c-.25.16-.532.293-.825.402C10.23 8.84 9.041 9 8 9s-2.229-.16-3.175-.514A4.414 4.414 0 0 1 4 8.084ZM12 6.5c0 .177-.075.35-.266.532-.2.19-.507.367-.91.517C10.022 7.85 8.96 8 8 8c-.959 0-2.021-.15-2.825-.45-.402-.151-.71-.329-.909-.518C4.075 6.851 4 6.677 4 6.5V5.084c.25.16.532.293.825.402C5.77 5.84 6.959 6 8 6s2.229-.16 3.175-.514c.293-.11.574-.242.825-.402V6.5Zm0 4.584c-.25.16-.532.293-.825.402C10.23 11.84 9.041 12 8 12s-2.229-.16-3.175-.514A4.415 4.415 0 0 1 4 11.084V12c0 .428.315.918 1.056 1.33.724.404 1.762.67 2.944.67s2.22-.266 2.944-.67C11.684 12.919 12 12.429 12 12v-.916Z"
                ></path>
            </svg>
            {alt ? <span className="sr-only">{alt}</span> : null}
        </>
    );
};
