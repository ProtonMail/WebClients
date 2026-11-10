/*
 * This file is auto-generated. Do not modify it manually!
 */
import { type SVGProps, forwardRef } from 'react';

import type { IconSize } from '../types';

interface IconProps extends Omit<SVGProps<SVGSVGElement>, 'ref'> {
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

export const IcTextStyle = forwardRef<SVGSVGElement, IconProps>(function IcTextStyle(
    { alt, title, size = 4, className = '', viewBox = '0 0 16 16', ...rest },
    ref
) {
    return (
        <>
            <svg
                ref={ref}
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
                    d="M7.31 1.34a.75.75 0 0 1 1.38 0l4.27 9.963a.5.5 0 1 1-.92.394L10.457 8H5.544L3.96 11.697a.5.5 0 0 1-.92-.394L7.31 1.34ZM5.974 7h4.054L8 2.27 5.973 7Z"
                    clipRule="evenodd"
                ></path>
                <path d="M0 15a1 1 0 0 1 1-1h14a1 1 0 1 1 0 2H1a1 1 0 0 1-1-1Z"></path>
            </svg>
            {alt ? <span className="sr-only">{alt}</span> : null}
        </>
    );
});
