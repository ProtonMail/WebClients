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

export const IcArrowsSwapRight = ({
    alt,
    title,
    size = 4,
    className = '',
    viewBox = '0 0 16 16',
    ...rest
}: IconProps) => {
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
                    d="M13.354 7.354a.5.5 0 0 1-.708-.708L13.293 6h-1.465a1.5 1.5 0 0 0-1.06.44L9.5 7.706 8.793 7l1.268-1.268A2.5 2.5 0 0 1 11.828 5h1.465l-.647-.646a.5.5 0 0 1 .708-.708l1.5 1.5a.5.5 0 0 1 0 .708l-1.5 1.5ZM1.5 12a.5.5 0 0 1 0-1h2.672a1.5 1.5 0 0 0 1.06-.44L6.5 9.294l.707.707-1.268 1.268A2.5 2.5 0 0 1 4.172 12H1.5ZM1 5.5a.5.5 0 0 1 .5-.5h2.672a2.5 2.5 0 0 1 1.767.732l4.829 4.829a1.5 1.5 0 0 0 1.06.439h1.465l-.647-.646a.5.5 0 0 1 .708-.708l1.5 1.5a.5.5 0 0 1 0 .708l-1.5 1.5a.5.5 0 0 1-.708-.708l.647-.646h-1.465a2.5 2.5 0 0 1-1.767-.732L5.232 6.439A1.5 1.5 0 0 0 4.172 6H1.5a.5.5 0 0 1-.5-.5Z"
                ></path>
            </svg>
            {alt ? <span className="sr-only">{alt}</span> : null}
        </>
    );
};
