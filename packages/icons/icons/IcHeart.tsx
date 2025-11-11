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

export const IcHeart = ({ alt, title, size = 4, className = '', viewBox = '0 0 16 16', ...rest }: IconProps) => {
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
                    d="M7.195 3.903a3.025 3.025 0 0 0-4.314 0A3.112 3.112 0 0 0 2.817 8.2L8 13.772 13.184 8.2a3.112 3.112 0 0 0-.065-4.297 3.025 3.025 0 0 0-4.314 0l-.456.462a.49.49 0 0 1-.698 0l-.456-.462Zm-5.012-.706a4.005 4.005 0 0 1 5.71 0L8 3.305l.107-.108a4.005 4.005 0 0 1 5.71 0 4.12 4.12 0 0 1 .086 5.688L8.36 14.843a.491.491 0 0 1-.72 0L2.097 8.885a4.12 4.12 0 0 1 .086-5.688Z"
                ></path>
            </svg>
            {alt ? <span className="sr-only">{alt}</span> : null}
        </>
    );
};
