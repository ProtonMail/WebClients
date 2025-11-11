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

export const IcCandlesCake = ({ alt, title, size = 4, className = '', viewBox = '0 0 16 16', ...rest }: IconProps) => {
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
                    d="m6.871 3.072.35-.876a.3.3 0 0 1 .558 0l.35.876a.677.677 0 1 1-1.258 0Zm-4 .5.35-.876a.3.3 0 0 1 .558 0l.35.876a.677.677 0 1 1-1.258 0Zm8.35-.876-.35.876a.677.677 0 1 0 1.258 0l-.35-.876a.3.3 0 0 0-.558 0Z"
                ></path>
                <path
                    fillRule="evenodd"
                    d="M8 4.5V6h3V5h1v1h.5A1.5 1.5 0 0 1 14 7.5v5a1.5 1.5 0 0 1-1.5 1.5h-10A1.5 1.5 0 0 1 1 12.5v-5A1.5 1.5 0 0 1 2.5 6H3V5h1v1h3V4.5h1Zm-6 3a.5.5 0 0 1 .5-.5h10a.5.5 0 0 1 .5.5v.691l-1.276.638a.5.5 0 0 1-.448 0l-1.105-.553a1.5 1.5 0 0 0-1.342 0l-1.105.553a.5.5 0 0 1-.448 0l-1.105-.553a1.5 1.5 0 0 0-1.342 0l-1 .5a.5.5 0 0 1-.523-.047L2 7.75V7.5Zm10.17 2.224.83-.415V11H2V9l.706.53a1.5 1.5 0 0 0 1.57.14l1-.5a.5.5 0 0 1 .448 0l1.105.554a1.5 1.5 0 0 0 1.342 0l1.105-.553a.5.5 0 0 1 .448 0l1.105.553a1.5 1.5 0 0 0 1.342 0ZM2 12h11v.5a.5.5 0 0 1-.5.5h-10a.5.5 0 0 1-.5-.5V12Z"
                ></path>
            </svg>
            {alt ? <span className="sr-only">{alt}</span> : null}
        </>
    );
};
