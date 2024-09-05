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

export const IcRobot = ({ alt, title, size = 4, className = '', viewBox = '0 0 16 16', ...rest }: IconProps) => {
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
                    d="M7.5 2.5a.5.5 0 1 1 1 0 .5.5 0 0 1-1 0ZM8 1a1.5 1.5 0 0 0-.5 2.915V4.5h-3a2.5 2.5 0 0 0-2.458 2.042A2.5 2.5 0 0 0 0 9v.5a2.5 2.5 0 0 0 2 2.45v.55A2.5 2.5 0 0 0 4.5 15h7a2.5 2.5 0 0 0 2.5-2.5v-.55a2.5 2.5 0 0 0 2-2.45V9a2.5 2.5 0 0 0-2.042-2.458A2.5 2.5 0 0 0 11.5 4.5h-3v-.585A1.5 1.5 0 0 0 8 1ZM4.5 5.5h7A1.5 1.5 0 0 1 13 7v5.5a1.5 1.5 0 0 1-1.5 1.5h-7A1.5 1.5 0 0 1 3 12.5V7a1.5 1.5 0 0 1 1.5-1.5ZM2 7.585A1.5 1.5 0 0 0 1 9v.5a1.5 1.5 0 0 0 1 1.415v-3.33Zm12 3.33v-3.33A1.5 1.5 0 0 1 15 9v.5a1.5 1.5 0 0 1-1 1.415ZM7 11.5a.5.5 0 0 0 0 1h2a.5.5 0 0 0 0-1H7ZM5.5 8a.5.5 0 1 0 0 1 .5.5 0 0 0 0-1ZM4 8.5a1.5 1.5 0 1 1 3 0 1.5 1.5 0 0 1-3 0Zm6 0a.5.5 0 1 1 1 0 .5.5 0 0 1-1 0Zm.5-1.5a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3Z"
                ></path>
            </svg>
            {alt ? <span className="sr-only">{alt}</span> : null}
        </>
    );
};
