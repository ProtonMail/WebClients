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

export const IcPaperClip = ({ alt, title, size = 4, className = '', viewBox = '0 0 16 16', ...rest }: IconProps) => {
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
                    d="M12.207 2.795a2.598 2.598 0 0 0-3.573 0L3.72 7.531a3.635 3.635 0 0 0 0 5.281c1.527 1.472 4.011 1.472 5.538 0l4.325-4.167a.541.541 0 1 1 .751.78l-4.324 4.168c-1.947 1.876-5.095 1.876-7.041 0a4.72 4.72 0 0 1 0-6.842l4.913-4.736c1.404-1.353 3.672-1.353 5.076 0a3.414 3.414 0 0 1 0 4.948l-4.914 4.736c-.86.83-2.249.83-3.11 0a2.109 2.109 0 0 1 0-3.054l4.324-4.168a.541.541 0 1 1 .752.781L5.686 9.425a1.024 1.024 0 0 0 0 1.493 1.171 1.171 0 0 0 1.607 0l4.914-4.736a2.33 2.33 0 0 0 0-3.387Z"
                ></path>
            </svg>
            {alt ? <span className="sr-only">{alt}</span> : null}
        </>
    );
};
