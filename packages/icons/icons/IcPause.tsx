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

export const IcPause = forwardRef<SVGSVGElement, IconProps>(function IcPause(
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
                    d="M5 4h2v8H5V4ZM4 4a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v8a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V4Zm6 0h2v8h-2V4ZM9 4a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v8a1 1 0 0 1-1 1h-2a1 1 0 0 1-1-1V4Z"
                ></path>
            </svg>
            {alt ? <span className="sr-only">{alt}</span> : null}
        </>
    );
});
