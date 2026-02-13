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

export const IcMegaphone = ({ alt, title, size = 4, className = '', viewBox = '0 0 16 16', ...rest }: IconProps) => {
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
                    d="M12.033 1.223C13.343.554 15 1.474 15 3.026v8.004c0 1.505-1.58 2.446-2.9 1.826a45.144 45.144 0 0 0-3.535-1.498l-.198-.07c.008.027.018.055.025.083l.31 1.278a1.904 1.904 0 0 1-1.624 2.338l-.226.012c-.73 0-1.396-.417-1.713-1.074L3.494 10.53A3 3 0 0 1 1 7.573v-.427a3 3 0 0 1 3-3h1.429c.281 0 .698-.078 1.242-.254.53-.171 1.126-.417 1.747-.707 1.241-.58 2.523-1.31 3.49-1.892l.125-.07ZM6.04 13.49a.903.903 0 0 0 1.69-.606l-.31-1.278a1.5 1.5 0 0 0-1.456-1.147H4.57l1.468 3.03ZM14 3.026c0-.797-.894-1.287-1.577-.876-1.96 1.18-5.259 2.996-6.994 2.996v4.427c1.766 0 5.15 1.462 7.096 2.378.678.318 1.475-.172 1.475-.921V3.026ZM4 5.146a2 2 0 0 0-2 2v.427a2 2 0 0 0 2 2h.571V5.146H4Z"
                    clipRule="evenodd"
                ></path>
            </svg>
            {alt ? <span className="sr-only">{alt}</span> : null}
        </>
    );
};
