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

                <path d="M8.023 8a3 3 0 0 1 2.884 3.824l-.492 1.726A2 2 0 0 1 8.49 15H3.509a2 2 0 0 1-1.923-1.45l-.493-1.726A3 3 0 0 1 3.977 8h4.046Z"></path>
                <path d="M12.531 9a2.5 2.5 0 0 1 2.372 3.291l-.561 1.684A1.5 1.5 0 0 1 12.919 15h-2.673a1 1 0 0 0 .96-.726l.701-2.45A2.987 2.987 0 0 0 11.26 9h1.271ZM11 4a2 2 0 1 1-1.921 2.553 3.98 3.98 0 0 0 .91-2.278A1.99 1.99 0 0 1 11 4ZM6 1a3 3 0 1 1 0 6 3 3 0 0 1 0-6Z"></path>
            </svg>
            {alt ? <span className="sr-only">{alt}</span> : null}
        </>
    );
};
