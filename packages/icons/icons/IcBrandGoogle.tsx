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

export const IcBrandGoogle = ({ alt, title, size = 4, className = '', viewBox = '0 0 16 16', ...rest }: IconProps) => {
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

                <path d="M10.6755 4.83091C9.95005 4.13727 9.02732 3.78409 7.9996 3.78409C6.17686 3.78409 4.63399 5.01485 4.08318 6.66878V6.67106C3.94318 7.09106 3.86364 7.53969 3.86364 8.00106C3.86364 8.46242 3.94318 8.91106 4.08318 9.33106C4.63393 10.9851 6.17679 12.216 7.9996 12.216C8.94141 12.216 9.74323 11.9678 10.3701 11.5478C11.1114 11.0514 11.605 10.3093 11.7673 9.43429H8V6.72656H14.5927C14.6755 7.18474 14.72 7.66202 14.72 8.15838C14.72 10.2902 13.9564 12.0847 12.6327 13.3034C11.4745 14.3725 9.8896 15.0001 7.9996 15.0001C5.2636 15.0001 2.8966 13.4319 1.74461 11.1446C1.27052 10.1996 1 9.1306 1 8.00106C1 6.87151 1.27045 5.80242 1.74455 4.85742L1.74414 4.85636C2.89596 2.56864 5.26323 1 7.9996 1C9.88641 1 11.471 1.69364 12.6832 2.82318L10.6755 4.83091Z"></path>
            </svg>
            {alt ? <span className="sr-only">{alt}</span> : null}
        </>
    );
};
