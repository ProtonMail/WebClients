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

export const IcArrowsFromCenterHorizontal = ({
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

                <path d="M3.146 9.854a.5.5 0 0 0 .708-.708L2.707 8H6.5a.5.5 0 0 0 0-1H2.707l1.147-1.146a.5.5 0 1 0-.708-.708l-2 2a.5.5 0 0 0 0 .708l2 2Zm9-.707a.5.5 0 0 0 .708.707l2-2a.5.5 0 0 0 0-.707l-2-2a.5.5 0 0 0-.708.707L13.293 7H9.5a.5.5 0 0 0 0 1h3.793l-1.147 1.147Z"></path>
            </svg>
            {alt ? <span className="sr-only">{alt}</span> : null}
        </>
    );
};
