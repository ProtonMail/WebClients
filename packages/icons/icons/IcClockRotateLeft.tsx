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

export const IcClockRotateLeft = ({
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

                <path d="M3.074 7.596A5.501 5.501 0 0 1 14 8.5a5.5 5.5 0 0 1-9.9 3.3l-.8.6a6.5 6.5 0 1 0-1.205-5.013l-.741-.74a.5.5 0 1 0-.708.707l1.5 1.5a.5.5 0 0 0 .602.08l1.75-1a.5.5 0 1 0-.496-.868l-.928.53Z"></path>
                <path d="M9 5.5a.5.5 0 0 0-1 0v3.207l1.646 1.647a.5.5 0 0 0 .708-.708L9 8.293V5.5Z"></path>
            </svg>
            {alt ? <span className="sr-only">{alt}</span> : null}
        </>
    );
};
