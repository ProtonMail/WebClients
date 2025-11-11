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

export const IcPenSquare = ({ alt, title, size = 4, className = '', viewBox = '0 0 16 16', ...rest }: IconProps) => {
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
                    d="M13.183 2 14 2.82 7.413 9.407a1 1 0 0 1-.518.275l-.712.137.137-.713a1 1 0 0 1 .275-.518L13.183 2Zm1.525.112-.818-.819a1 1 0 0 0-1.414 0L5.888 7.881a2 2 0 0 0-.55 1.037l-.276 1.437a.5.5 0 0 0 .585.585l1.437-.276a2 2 0 0 0 1.036-.55l6.588-6.588a1 1 0 0 0 0-1.414ZM2.001 4.5A1.5 1.5 0 0 1 3.5 3h5.893V2H3.501A2.5 2.5 0 0 0 1 4.5v8A2.5 2.5 0 0 0 3.5 15h7.889a2.5 2.5 0 0 0 2.5-2.5V6.605h-1v5.893a1.5 1.5 0 0 1-1.5 1.5H3.5A1.5 1.5 0 0 1 2 12.5V4.5Z"
                ></path>
            </svg>
            {alt ? <span className="sr-only">{alt}</span> : null}
        </>
    );
};
