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

export const IcBrandApple = ({ alt, title, size = 4, className = '', viewBox = '0 0 16 16', ...rest }: IconProps) => {
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
                    d="M4.804 14.68a3.176 3.176 0 0 1-.721-.676 9.506 9.506 0 0 1-.62-.84 8.432 8.432 0 0 1-1.032-2.117 7.857 7.857 0 0 1-.429-2.518 4.563 4.563 0 0 1 .584-2.382A3.249 3.249 0 0 1 3.8 4.887a3.294 3.294 0 0 1 1.652-.492c.221.006.442.036.657.091.164.046.374.119.62.21l.548.219c.148.061.305.095.465.1.128-.007.254-.031.374-.073.092 0 .247-.082.475-.182l.538-.201c.2-.065.405-.116.612-.155.221-.027.445-.027.666 0 .387.026.768.109 1.132.246.58.221 1.077.616 1.423 1.132-.151.09-.292.198-.42.32a3.65 3.65 0 0 0-.711.912 2.829 2.829 0 0 0-.375 1.46c-.006.59.162 1.167.484 1.66.237.366.548.677.913.913.15.107.312.196.483.265a5.364 5.364 0 0 1-.237.639 8.639 8.639 0 0 1-1.323 2.153 2.923 2.923 0 0 1-.685.64c-.248.165-.54.254-.84.255a1.918 1.918 0 0 1-.602-.073 4.573 4.573 0 0 1-.492-.192 5.198 5.198 0 0 0-.584-.274 2.41 2.41 0 0 0-.64-.1 2.735 2.735 0 0 0-.674.091 3.65 3.65 0 0 0-.53.183c-.237.1-.401.173-.492.2-.188.056-.38.09-.575.1a1.634 1.634 0 0 1-.867-.264l.009.01ZM8.783 3.956a2.117 2.117 0 0 1-1.123.255 2.29 2.29 0 0 1 .155-1.186 3.23 3.23 0 0 1 1.497-1.707A2.646 2.646 0 0 1 10.398 1c.045.407-.005.82-.146 1.205-.137.37-.334.716-.584 1.022-.254.3-.564.549-.913.73h.028Z"
                ></path>
            </svg>
            {alt ? <span className="sr-only">{alt}</span> : null}
        </>
    );
};
