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

export const IcSpeechBubble = ({ alt, title, size = 4, className = '', viewBox = '0 0 16 16', ...rest }: IconProps) => {
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
                    d="M9.086 10.996H13a1 1 0 0 0 1-1V4A1 1 0 0 0 13 3H3a1 1 0 0 0-1 1v5.996a1 1 0 0 0 1 1h4v2.085l2.086-2.085Zm-2.489 3.9A.35.35 0 0 1 6 14.65v-2.653H3a2 2 0 0 1-2-2V4A2 2 0 0 1 3 2h10a2 2 0 0 1 2 2v5.996a2 2 0 0 1-2 2H9.5l-2.903 2.9Z"
                ></path>
            </svg>
            {alt ? <span className="sr-only">{alt}</span> : null}
        </>
    );
};
