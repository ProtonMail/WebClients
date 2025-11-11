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

export const IcTrash = ({ alt, title, size = 4, className = '', viewBox = '0 0 16 16', ...rest }: IconProps) => {
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
                    d="M6.5 1a.5.5 0 0 0-.447.276L5.19 3H2a.5.5 0 0 0 0 1h1.022l.435 9.568A1.5 1.5 0 0 0 4.956 15h6.088a1.5 1.5 0 0 0 1.499-1.432L12.978 4H14a.5.5 0 0 0 0-1h-3.191l-.862-1.724A.5.5 0 0 0 9.5 1h-3Zm3.191 2-.5-1H6.809l-.5 1h3.382ZM4.023 4h7.954l-.433 9.523a.5.5 0 0 1-.5.477H4.956a.5.5 0 0 1-.5-.477L4.023 4ZM7 6a.5.5 0 0 0-1 0v6a.5.5 0 0 0 1 0V6Zm3 0a.5.5 0 0 0-1 0v6a.5.5 0 0 0 1 0V6Z"
                ></path>
            </svg>
            {alt ? <span className="sr-only">{alt}</span> : null}
        </>
    );
};
