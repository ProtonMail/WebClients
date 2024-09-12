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

export const IcSwitchOnLock = ({ alt, title, size = 4, className = '', viewBox = '0 0 16 16', ...rest }: IconProps) => {
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
                    d="M4.782 13.5h4.47l-.884.5h-4.47l.884-.5Zm-.921-.628L2 9.461v4.464l1.86-1.053Zm7.865-.448a.7.7 0 0 1-.399 1.05L8.792 14.91a.7.7 0 0 1-.345.091H1.7a.7.7 0 0 1-.7-.7V7.5h.008A1 1 0 0 1 1 7.372V2a1 1 0 0 1 1-1h5.5a1 1 0 0 1 1 1v5.354l3.226 5.07Zm-1.137.076H4.797L2 7.372V2h5.5v5.354a1 1 0 0 0 .156.537L10.59 12.5ZM5 4a.5.5 0 0 1 .5.5V6a.5.5 0 0 1-1 0V4.5A.5.5 0 0 1 5 4Zm1.134 6.5a.688.688 0 0 1-.1-.413c.013-.107.054-.138.066-.145.013-.007.06-.027.16.015.1.043.218.138.307.293.09.154.113.305.1.412-.013.107-.054.139-.067.146-.012.007-.06.027-.159-.015a.688.688 0 0 1-.307-.293ZM5.6 9.076c-.346.2-.518.55-.559.892-.041.342.04.708.227 1.032.187.324.464.577.78.712.317.136.706.162 1.052-.038.347-.2.519-.55.56-.892a1.683 1.683 0 0 0-.227-1.032 1.683 1.683 0 0 0-.78-.713c-.317-.135-.706-.161-1.053.039ZM10 3.8a.8.8 0 0 1 .8-.8h.1v-.25a1.6 1.6 0 1 1 3.2 0V3h.1a.8.8 0 0 1 .8.8v2.4a.8.8 0 0 1-.8.8h-3.4a.8.8 0 0 1-.8-.8V3.8Zm3.4-.8v-.25a.9.9 0 1 0-1.8 0V3h1.8Z"
                ></path>
            </svg>
            {alt ? <span className="sr-only">{alt}</span> : null}
        </>
    );
};
