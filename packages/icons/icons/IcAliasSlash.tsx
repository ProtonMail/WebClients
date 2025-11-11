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

export const IcAliasSlash = ({ alt, title, size = 4, className = '', viewBox = '0 0 16 16', ...rest }: IconProps) => {
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
                    d="M2.36 1.224a.5.5 0 1 0-.72.692l12 12.5a.5.5 0 0 0 .72-.692l-.79-.823a2.5 2.5 0 0 0-3.386-3.527L8.867 8H14.5a.5.5 0 0 0 0-1h-1.11l-.978-3.913a2 2 0 0 0-2.728-1.353l-1.093.469a1.5 1.5 0 0 1-1.182 0l-1.093-.469a2.001 2.001 0 0 0-2.571.931L2.36 1.224Zm2.162 2.25L7.906 7h4.454l-.918-3.67a1 1 0 0 0-1.364-.677l-1.093.469a2.5 2.5 0 0 1-1.97 0l-1.093-.469a1 1 0 0 0-1.364.677l-.036.145Zm6.382 6.649 1.947 2.029a1.5 1.5 0 0 0-1.947-2.029Z"
                ></path>
                <path d="m5.213 7 .96 1H1.5a.5.5 0 0 1 0-1h1.11l.538-2.152.817.852L3.64 7h1.573Z"></path>
                <path
                    fillRule="evenodd"
                    d="M10.139 12.13 7.644 9.532a1.996 1.996 0 0 0-1.072.568A2.5 2.5 0 1 0 7 11.5a1 1 0 1 1 2 0 2.5 2.5 0 0 0 2.902 2.468l-1.087-1.133a1.506 1.506 0 0 1-.676-.705ZM6 11.5a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0Z"
                ></path>
            </svg>
            {alt ? <span className="sr-only">{alt}</span> : null}
        </>
    );
};
