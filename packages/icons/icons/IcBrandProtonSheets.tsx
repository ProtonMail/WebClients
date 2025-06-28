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

export const IcBrandProtonSheets = ({
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

                <path d="M11.5 1H8v3.5h3.5V1Z"></path>
                <path d="M11.5 1v.88H3.333c-.803 0-1.454.65-1.454 1.453v9.334c0 .803.651 1.454 1.454 1.454h9.334c.803 0 1.454-.651 1.454-1.454V4.5H15v8.227A2.333 2.333 0 0 1 12.666 15H3.273a2.333 2.333 0 0 1-2.272-2.273L1 12.667V3.333c0-1.268 1.012-2.3 2.273-2.332L3.333 1H11.5Z"></path>
                <path d="M15 4.5h-3.5V8H15V4.5Z"></path>
                <path
                    fillRule="evenodd"
                    d="M5.91 6.488c.324 0 .587.263.587.588v4.984a.588.588 0 1 1-1.176 0V7.076c0-.325.264-.588.588-.588Z"
                    clipRule="evenodd"
                ></path>
                <path
                    fillRule="evenodd"
                    d="M3.361 10.324c0-.324.264-.588.588-.588h5.544a.588.588 0 1 1 0 1.176H3.95a.588.588 0 0 1-.588-.588Z"
                    clipRule="evenodd"
                ></path>
            </svg>
            {alt ? <span className="sr-only">{alt}</span> : null}
        </>
    );
};
