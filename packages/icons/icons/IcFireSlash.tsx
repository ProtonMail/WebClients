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

export const IcFireSlash = ({ alt, title, size = 4, className = '', viewBox = '0 0 16 16', ...rest }: IconProps) => {
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
                    d="m4.079 6.218.692.721c-.383.365-.69.793-.906 1.263a3.959 3.959 0 0 0 .082 3.484c.28.541.683 1.02 1.182 1.402.5.381 1.084.654 1.711.798a4.58 4.58 0 0 0 1.912.026 4.469 4.469 0 0 0 1.885-.863l.695.724a5.47 5.47 0 0 1-2.385 1.12 5.581 5.581 0 0 1-2.33-.033 5.453 5.453 0 0 1-2.094-.977 5.186 5.186 0 0 1-1.465-1.738 4.959 4.959 0 0 1-.102-4.361c.27-.585.651-1.116 1.123-1.566Zm8.498 6.077 1.784 1.859a.5.5 0 0 1-.722.692l-12-12.5a.5.5 0 1 1 .722-.692l3.031 3.158a4.661 4.661 0 0 0 .738-2.807v-.006a4.646 4.646 0 0 0-.116-.792c-.018-.076-.027-.114-.018-.142a.1.1 0 0 1 .048-.055c.026-.014.063-.01.137-.005a6.786 6.786 0 0 1 .81.116l.03.006c2.582.55 4.217 2.586 4.217 5.024 0 .196-.014.389-.042.58-.14.982-.625 1.898-1.263 2.618a5.62 5.62 0 0 1-.09.099l.292.304.061-.04c.683-.462 1.471-1.283 1.975-2.737a8.417 8.417 0 0 0 .34-1.337c.015-.08.028-.16.04-.243l.01-.063c.014-.1.021-.15.054-.174a.107.107 0 0 1 .098-.013c.038.015.056.057.092.141a4.645 4.645 0 0 1 .103.258c.055.147.112.315.168.5.07.228.136.482.197.757.335 1.536.439 3.706-.686 5.476l-.01.018Zm-1.74-1.811a5.815 5.815 0 0 0 1.66-1.83c.025.993-.14 2.011-.638 2.893l-1.022-1.063ZM9.15 8.724c.65-.715 1.09-1.65 1.09-2.573 0-1.832-1.147-3.418-3.101-3.966.01.62-.082 1.241-.276 1.839a5.763 5.763 0 0 1-.76 1.526l3.047 3.175Z"
                ></path>
            </svg>
            {alt ? <span className="sr-only">{alt}</span> : null}
        </>
    );
};
