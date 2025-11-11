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

export const IcLock = ({ alt, title, size = 4, className = '', viewBox = '0 0 16 16', ...rest }: IconProps) => {
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
                    d="M5 5h6a3 3 0 0 0-6 0ZM4 5v.02c-.392.023-.67.077-.908.198a2 2 0 0 0-.874.874C2 6.52 2 7.08 2 8.2v3.6c0 1.12 0 1.68.218 2.108a2 2 0 0 0 .874.874C3.52 15 4.08 15 5.2 15h5.6c1.12 0 1.68 0 2.108-.218a2 2 0 0 0 .874-.874C14 13.48 14 12.92 14 11.8V8.2c0-1.12 0-1.68-.218-2.108a2 2 0 0 0-.874-.874c-.237-.121-.516-.175-.908-.199V5a4 4 0 0 0-8 0Zm-.032 1.024C4.25 6 4.623 6 5.2 6h5.6c.577 0 .949 0 1.232.024.272.022.373.06.422.085a1 1 0 0 1 .437.437c.025.05.063.15.085.422C13 7.25 13 7.623 13 8.2v3.6c0 .577 0 .949-.024 1.232-.022.272-.06.373-.085.422a1 1 0 0 1-.437.437c-.05.025-.15.063-.422.085C11.75 14 11.377 14 10.8 14H5.2c-.577 0-.949 0-1.232-.024-.272-.022-.373-.06-.422-.085a1 1 0 0 1-.437-.437c-.025-.05-.063-.15-.085-.422C3 12.75 3 12.377 3 11.8V8.2c0-.577 0-.949.024-1.232.022-.272.06-.373.085-.422a1 1 0 0 1 .437-.437c.05-.025.15-.063.422-.085ZM9 9a1 1 0 0 1-.53.883l.437 1.744a.3.3 0 0 1-.291.373H7.384a.3.3 0 0 1-.29-.373l.435-1.744A1 1 0 1 1 9 9Z"
                ></path>
            </svg>
            {alt ? <span className="sr-only">{alt}</span> : null}
        </>
    );
};
