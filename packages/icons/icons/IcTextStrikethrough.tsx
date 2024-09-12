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

export const IcTextStrikethrough = ({
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
                    d="M5.808 2.877c-.598.522-.903 1.238-.811 2.068.122 1.1.575 1.639 1.158 1.96.061.034.123.066.188.095H4.735c-.381-.48-.64-1.113-.732-1.945-.13-1.17.315-2.204 1.147-2.932C5.974 1.403 7.154 1 8.5 1c1.36 0 2.346.411 3.062.985a4.4 4.4 0 0 1 .438.402V1.5a.5.5 0 0 1 1 0v4a.5.5 0 0 1-1 0V4.12c-.233-.448-.558-.951-1.062-1.355C10.404 2.34 9.64 2 8.5 2c-1.154 0-2.085.346-2.692.877ZM1.5 8a.5.5 0 0 0 0 1h9.19c.064.03.125.06.184.093.575.32 1.018.855 1.128 1.957C12.178 12.795 10.73 14 9.5 14a6.1 6.1 0 0 1-3.002-.81c-.759-.433-1.272-.943-1.498-1.318V10.5a.5.5 0 0 0-1 0v4a.5.5 0 0 0 1 0v-1.142c.291.25.63.488 1.002.701A7.09 7.09 0 0 0 9.5 15c1.77 0 3.736-1.665 3.498-4.05-.084-.833-.335-1.469-.712-1.95H14.5a.5.5 0 0 0 0-1h-13Z"
                ></path>
            </svg>
            {alt ? <span className="sr-only">{alt}</span> : null}
        </>
    );
};
