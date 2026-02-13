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

export const IcSpeechBubbles = ({
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

                <path
                    fillRule="evenodd"
                    d="M8.5 9a2.5 2.5 0 0 1 2.5 2.5V13l2 2H3.5A2.5 2.5 0 0 1 1 12.5v-1A2.5 2.5 0 0 1 3.5 9h5Zm-5 1a1.5 1.5 0 0 0-1.492 1.347L2 11.5v1A1.5 1.5 0 0 0 3.5 14h7.086L10 13.414V11.5a1.5 1.5 0 0 0-1.347-1.492L8.5 10h-5Zm7-9A2.5 2.5 0 0 1 13 3.5v2.214L15 8H3.5A2.5 2.5 0 0 1 1 5.5v-2A2.5 2.5 0 0 1 3.5 1h7Zm-7 1a1.5 1.5 0 0 0-1.492 1.347L2 3.5v2A1.5 1.5 0 0 0 3.5 7h9.297L12 6.09V3.5A1.5 1.5 0 0 0 10.5 2h-7Z"
                    clipRule="evenodd"
                ></path>
            </svg>
            {alt ? <span className="sr-only">{alt}</span> : null}
        </>
    );
};
