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

export const IcAt = ({ alt, title, size = 4, className = '', viewBox = '0 0 16 16', ...rest }: IconProps) => {
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
                    d="M2 8a6 6 0 1 1 12 0v.5c0 1.108-.886 2-1.988 2-1.122 0-1.896-.876-1.697-1.815.04-.13.071-.26.097-.39.242-.923.592-1.959 1.052-3.11a.5.5 0 1 0-.928-.37c-.164.408-.315.805-.452 1.19A2.648 2.648 0 0 0 9.098 5c-1.435-.828-3.382-.143-4.348 1.531-.966 1.674-.587 3.703.848 4.531 1.26.728 2.916.287 3.955-.965.456.85 1.423 1.403 2.46 1.403A2.99 2.99 0 0 0 15 8.5V8a7 7 0 1 0-4.303 6.461.5.5 0 1 0-.385-.922A6 6 0 0 1 2 8Zm7.449.024a18.183 18.183 0 0 0-.108.431c-.064.191-.15.384-.26.576-.766 1.326-2.147 1.648-2.983 1.165-.836-.483-1.247-1.84-.482-3.165.765-1.326 2.146-1.648 2.982-1.165.623.36 1.01 1.203.85 2.158Z"
                ></path>
            </svg>
            {alt ? <span className="sr-only">{alt}</span> : null}
        </>
    );
};
