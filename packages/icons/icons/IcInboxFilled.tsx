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

export const IcInboxFilled = ({ alt, title, size = 4, className = '', viewBox = '0 0 16 16', ...rest }: IconProps) => {
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
                    d="M11.65 2a2 2 0 0 1 1.715.97l2.279 3.798c.233.388.356.833.356 1.286V12a2 2 0 0 1-2 2h-.161a2.525 2.525 0 0 1-.339.025h-11c-.115 0-.228-.01-.339-.025H2a2 2 0 0 1-2-2V8.054a2.5 2.5 0 0 1 .356-1.286L2.635 2.97A2 2 0 0 1 4.35 2h7.3Zm-7.3 1a1 1 0 0 0-.858.485L1.382 7h2.29a2.497 2.497 0 0 1 1.095.256c.246.12.475.279.672.476l.829.829A1.5 1.5 0 0 0 7.328 9h1.344a1.5 1.5 0 0 0 1.06-.44l.828-.828c.198-.197.427-.356.673-.476A2.498 2.498 0 0 1 12.328 7h2.29l-2.11-3.515A1 1 0 0 0 11.65 3h-7.3Z"
                    clipRule="evenodd"
                ></path>
            </svg>
            {alt ? <span className="sr-only">{alt}</span> : null}
        </>
    );
};
