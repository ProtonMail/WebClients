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

export const IcPowerOff = forwardRef<SVGSVGElement, IconProps>(function IcPowerOff(
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
                    d="M8.5 0a.5.5 0 0 1 .5.5v8a.5.5 0 0 1-1 0v-8a.5.5 0 0 1 .5-.5ZM5.433 2.186a.5.5 0 0 1-.183.683 6.5 6.5 0 1 0 6.5 0 .5.5 0 1 1 .5-.865 7.5 7.5 0 1 1-7.5 0 .5.5 0 0 1 .683.182Z"
                ></path>
            </svg>
            {alt ? <span className="sr-only">{alt}</span> : null}
        </>
    );
});
