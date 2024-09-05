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

export const IcTagPlus = ({ alt, title, size = 4, className = '', viewBox = '0 0 16 16', ...rest }: IconProps) => {
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
                    d="M14 .5a.5.5 0 0 0-1 0V2h-1.5a.5.5 0 0 0 0 1H13v1.5a.5.5 0 0 0 1 0V3h1.5a.5.5 0 0 0 0-1H14V.5Zm-.444 8.925-4.95 4.95L2.182 7.95V3h4.95l6.424 6.425Zm-4.242 5.657a1 1 0 0 1-1.415 0L1.475 8.657a1 1 0 0 1-.293-.707V3a1 1 0 0 1 1-1h4.95a1 1 0 0 1 .707.293l6.424 6.425a1 1 0 0 1 0 1.414l-4.95 4.95ZM5.682 5.5a1 1 0 1 1-2 0 1 1 0 0 1 2 0Z"
                ></path>
            </svg>
            {alt ? <span className="sr-only">{alt}</span> : null}
        </>
    );
};
