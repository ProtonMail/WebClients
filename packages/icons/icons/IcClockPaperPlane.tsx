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

export const IcClockPaperPlane = ({
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

                <path d="M7.5 1a6 6 0 1 0 0 12 .5.5 0 0 1 0 1 7 7 0 1 1 6.662-4.846.5.5 0 0 1-.951-.308A6 6 0 0 0 7.5 1Zm2.487 8.382 5.763 2.881a.451.451 0 0 1 0 .808l-5.763 2.88a.452.452 0 0 1-.654-.403v-2.141l2.449-.56c.214-.024.214-.336 0-.36l-2.449-.561v-2.14c0-.336.354-.554.654-.404ZM8 3.5a.5.5 0 0 0-1 0V7a.5.5 0 0 0 .146.354l1.5 1.5a.5.5 0 0 0 .708-.708L8 6.793V3.5Z"></path>
            </svg>
            {alt ? <span className="sr-only">{alt}</span> : null}
        </>
    );
};
