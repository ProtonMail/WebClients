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

export const IcTrashCross = ({ alt, title, size = 4, className = '', viewBox = '0 0 16 16', ...rest }: IconProps) => {
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
                    d="M6.053 1.276A.5.5 0 0 1 6.5 1h3a.5.5 0 0 1 .447.276L10.81 3H14a.5.5 0 0 1 0 1h-1.022l-.435 9.568A1.5 1.5 0 0 1 11.044 15H4.956a1.5 1.5 0 0 1-1.499-1.432L3.022 4H2a.5.5 0 0 1 0-1h3.191l.862-1.724ZM9.19 2l.5 1H6.309l.5-1h2.382Zm2.786 2H4.023l.433 9.523a.5.5 0 0 0 .5.477h6.088a.5.5 0 0 0 .5-.477L11.977 4ZM6.354 6.646a.5.5 0 1 0-.708.708L7.293 9l-1.647 1.646a.5.5 0 0 0 .708.708L8 9.707l1.646 1.647a.5.5 0 0 0 .708-.708L8.707 9l1.647-1.646a.5.5 0 0 0-.708-.708L8 8.293 6.354 6.646Z"
                ></path>
            </svg>
            {alt ? <span className="sr-only">{alt}</span> : null}
        </>
    );
};
