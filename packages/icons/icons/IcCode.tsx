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

export const IcCode = ({ alt, title, size = 4, className = '', viewBox = '0 0 16 16', ...rest }: IconProps) => {
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
                    d="M9.496 4.121a.504.504 0 0 0-.977-.243l-2.015 8a.504.504 0 0 0 .977.243l2.015-8Zm-4.618.18a.498.498 0 0 0-.101-.7.506.506 0 0 0-.705.1L1.14 7.58a.696.696 0 0 0 0 .84l2.93 3.88a.506.506 0 0 0 .706.1.498.498 0 0 0 .1-.7L2.084 8l2.795-3.7Zm7.05-.6a.506.506 0 0 0-.705-.1.498.498 0 0 0-.1.7L13.916 8l-2.795 3.7a.498.498 0 0 0 .101.7.506.506 0 0 0 .705-.1l2.931-3.88a.696.696 0 0 0 0-.84l-2.93-3.88Z"
                ></path>
            </svg>
            {alt ? <span className="sr-only">{alt}</span> : null}
        </>
    );
};
