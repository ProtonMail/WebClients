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

export const IcThreeDotsHorizontal = forwardRef<SVGSVGElement, IconProps>(function IcThreeDotsHorizontal(
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

                <path d="M4 8a1 1 0 1 1-2 0 1 1 0 0 1 2 0Z"></path>
                <path d="M9 8a1 1 0 1 1-2 0 1 1 0 0 1 2 0Z"></path>
                <path d="M14 8a1 1 0 1 1-2 0 1 1 0 0 1 2 0Z"></path>
            </svg>
            {alt ? <span className="sr-only">{alt}</span> : null}
        </>
    );
});
