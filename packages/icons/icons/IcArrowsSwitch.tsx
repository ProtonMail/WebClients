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

export const IcArrowsSwitch = ({ alt, title, size = 4, className = '', viewBox = '0 0 16 16', ...rest }: IconProps) => {
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
                    d="M12.4 1.644a.5.5 0 1 0-.702.712L13.363 4H3.428a1.5 1.5 0 0 0-1.5 1.5V7h1V5.5a.5.5 0 0 1 .5-.5h9.935l-1.665 1.644a.5.5 0 1 0 .702.712l2.388-2.358a.7.7 0 0 0 0-.996L12.4 1.644ZM13.068 9v2.5a.5.5 0 0 1-.5.5H2.634l1.665-1.644a.5.5 0 0 0-.703-.712l-2.388 2.358a.7.7 0 0 0 0 .996l2.388 2.358a.5.5 0 0 0 .703-.712L2.634 13h9.934a1.5 1.5 0 0 0 1.5-1.5V9h-1Z"
                ></path>
            </svg>
            {alt ? <span className="sr-only">{alt}</span> : null}
        </>
    );
};
