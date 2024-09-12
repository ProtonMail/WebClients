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

export const IcAlias = ({ alt, title, size = 4, className = '', viewBox = '0 0 16 16', ...rest }: IconProps) => {
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
                    d="M3.588 3.087a2 2 0 0 1 2.728-1.353l1.093.469a1.5 1.5 0 0 0 1.182 0l1.093-.469a2 2 0 0 1 2.728 1.353L13.39 7h1.11a.5.5 0 0 1 0 1h-13a.5.5 0 0 1 0-1h1.11l.978-3.913Zm2.334-.434a1 1 0 0 0-1.364.677L3.64 7h8.72l-.918-3.67a1 1 0 0 0-1.364-.677l-1.093.469a2.5 2.5 0 0 1-1.97 0l-1.093-.469Z"
                ></path>
                <path
                    fillRule="evenodd"
                    d="M6.572 10.1A2.5 2.5 0 1 0 7 11.5a1 1 0 1 1 2 0 2.5 2.5 0 1 0 .428-1.4C9.065 9.73 8.56 9.5 8 9.5c-.56 0-1.065.23-1.428.6ZM6 11.5a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0Zm4 0a1.5 1.5 0 1 0 3 0 1.5 1.5 0 0 0-3 0Z"
                ></path>
            </svg>
            {alt ? <span className="sr-only">{alt}</span> : null}
        </>
    );
};
