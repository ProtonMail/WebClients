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

export const IcLockFilled = ({ alt, title, size = 4, className = '', viewBox = '0 0 16 16', ...rest }: IconProps) => {
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
                    d="M5.2 5H5a3 3 0 0 1 6 0H5.2ZM4 5.02V5a4 4 0 1 1 8 0v.02c.392.023.67.077.908.198a2 2 0 0 1 .874.874C14 6.52 14 7.08 14 8.2v3.6c0 1.12 0 1.68-.218 2.108a2 2 0 0 1-.874.874C12.48 15 11.92 15 10.8 15H5.2c-1.12 0-1.68 0-2.108-.218a2 2 0 0 1-.874-.874C2 13.48 2 12.92 2 11.8V8.2c0-1.12 0-1.68.218-2.108a2 2 0 0 1 .874-.874c.238-.121.516-.175.908-.199Zm4.47 4.863a1 1 0 1 0-.94 0l-.437 1.744a.3.3 0 0 0 .291.373h1.232a.3.3 0 0 0 .29-.373l-.435-1.744Z"
                ></path>
            </svg>
            {alt ? <span className="sr-only">{alt}</span> : null}
        </>
    );
};
