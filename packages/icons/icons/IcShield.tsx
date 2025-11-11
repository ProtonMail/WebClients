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

export const IcShield = ({ alt, title, size = 4, className = '', viewBox = '0 0 16 16', ...rest }: IconProps) => {
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
                    d="M3.07 3.723c-.16 1.784-.077 3.66.587 5.403.67 1.761 1.958 3.456 4.343 4.802 2.385-1.346 3.673-3.04 4.343-4.802.664-1.743.748-3.62.587-5.403L8 2.03 3.07 3.723Zm-.63-.84 5.399-1.856a.497.497 0 0 1 .323 0l5.398 1.856a.495.495 0 0 1 .333.415c.417 3.917-.17 8.692-5.663 11.645a.488.488 0 0 1-.459 0C2.278 11.99 1.689 7.215 2.107 3.298a.495.495 0 0 1 .333-.415Z"
                ></path>
            </svg>
            {alt ? <span className="sr-only">{alt}</span> : null}
        </>
    );
};
