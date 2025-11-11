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

export const IcMoon = ({ alt, title, size = 4, className = '', viewBox = '0 0 16 16', ...rest }: IconProps) => {
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
                    d="M9.075 2C5.725 2 3.01 4.686 3.01 8s2.715 6 6.064 6c.886 0 1.728-.188 2.487-.526C8.748 13.203 6.548 10.856 6.548 8c0-2.856 2.2-5.203 5.014-5.474A6.097 6.097 0 0 0 9.075 2ZM2 8c0-3.866 3.168-7 7.075-7 1.833 0 3.503.69 4.76 1.821.173.156.215.41.101.613a.508.508 0 0 1-.58.238 4.596 4.596 0 0 0-1.249-.172C9.595 3.5 7.559 5.515 7.559 8s2.036 4.5 4.548 4.5c.434 0 .853-.06 1.25-.172a.508.508 0 0 1 .58.238.496.496 0 0 1-.102.613A7.093 7.093 0 0 1 9.075 15C5.168 15 2 11.866 2 8Z"
                ></path>
            </svg>
            {alt ? <span className="sr-only">{alt}</span> : null}
        </>
    );
};
