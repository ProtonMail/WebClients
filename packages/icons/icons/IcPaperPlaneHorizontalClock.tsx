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

export const IcPaperPlaneHorizontalClock = ({
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
                    d="M2.213 2.897 10.43 7h.07c1.626 0 3.05.862 3.841 2.155l.365-.183a.534.534 0 0 0 0-.954L1.77 1.558a.532.532 0 0 0-.756.596l1.414 6.093a1.08 1.08 0 0 1 0 .48l-1.405 6.118a.533.533 0 0 0 .756.598l4.54-2.273a4.467 4.467 0 0 1-.267-.985l-3.833 1.92L3.39 9l3.365.002c.252-.377.56-.714.91-1L3.395 8 2.212 2.896ZM14 11.5a3.5 3.5 0 1 1-7 0 3.5 3.5 0 0 1 7 0ZM10.5 9a.5.5 0 0 1 .5.5v1.793l.854.853a.5.5 0 0 1-.708.708l-1-1-.146-.147V9.5a.5.5 0 0 1 .5-.5Z"
                    clipRule="evenodd"
                ></path>
            </svg>
            {alt ? <span className="sr-only">{alt}</span> : null}
        </>
    );
};
