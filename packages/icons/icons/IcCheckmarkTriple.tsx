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

export const IcCheckmarkTriple = ({
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
                    d="M12.103 1.146a.5.5 0 0 1 .002.707L7.74 6.241a.7.7 0 0 1-.995-.002L4.394 3.852a.5.5 0 0 1 .712-.702l2.14 2.171 4.15-4.174a.5.5 0 0 1 .707-.001ZM12.1 9.647a.5.5 0 0 1 .005.708L7.744 14.79a.7.7 0 0 1-1.002-.005L4.39 12.352a.5.5 0 0 1 .72-.695l2.137 2.213 4.147-4.217a.5.5 0 0 1 .707-.006Zm.004-3.293a.5.5 0 0 0-.71-.704L7.246 9.847 5.108 7.654a.5.5 0 1 0-.716.698l2.352 2.412a.7.7 0 0 0 .999.004l4.362-4.414Z"
                ></path>
            </svg>
            {alt ? <span className="sr-only">{alt}</span> : null}
        </>
    );
};
