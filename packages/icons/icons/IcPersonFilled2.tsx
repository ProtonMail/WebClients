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

export const IcPersonFilled2 = ({
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

                <path d="M5.5 8c.998 0 2.208.243 3.122.857.097.066.19.136.28.21l.051.043a3.324 3.324 0 0 1 .267.255l.047.051.09.107.019.024a2.906 2.906 0 0 1 .299.466l.036.071a2.825 2.825 0 0 1 .168.451l.024.087.018.078.021.1a3.285 3.285 0 0 1 .058.629l-.009.452a8.975 8.975 0 0 1-.023.385 6.412 6.412 0 0 1-.058.476c-.008.051-.014.1-.023.148-.007.038-.016.074-.024.11l-.029.13-.027.097-.036.118-.03.08a2.02 2.02 0 0 1-.1.221 1.375 1.375 0 0 1-.07.114.93.93 0 0 1-.037.049l-.027.03c-.011.013-.02.025-.031.035a.598.598 0 0 1-.092.074l-.022.014a.308.308 0 0 1-.062.025c-.008.003-.014.007-.02.008-.02.005-.03.005-.03.005h-7.5S1 14 1 11.429c0-1.203.574-2.031 1.378-2.572C3.292 8.243 4.502 8 5.5 8ZM11 8c.887 0 1.962.243 2.774.857.715.54 1.226 1.369 1.226 2.572C15 14 14.333 14 14.333 14h-3.751c.228-.48.372-1.148.408-2.08l.001-.01v-.01l.009-.452v-.02c0-1.433-.643-2.486-1.535-3.19A5.207 5.207 0 0 1 11 8ZM5.5 2a2.5 2.5 0 1 1 0 5 2.5 2.5 0 0 1 0-5ZM11 3a2 2 0 1 1 0 4 2 2 0 0 1 0-4Z"></path>
            </svg>
            {alt ? <span className="sr-only">{alt}</span> : null}
        </>
    );
};
