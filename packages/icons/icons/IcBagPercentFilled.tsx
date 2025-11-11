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

export const IcBagPercentFilled = ({
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

                <path d="M5.5 7.5C5.5 7.22386 5.72386 7 6 7C6.27614 7 6.5 7.22386 6.5 7.5C6.5 7.77614 6.27614 8 6 8C5.72386 8 5.5 7.77614 5.5 7.5Z"></path>
                <path d="M9.5 10.5C9.5 10.2239 9.72386 10 10 10C10.2761 10 10.5 10.2239 10.5 10.5C10.5 10.7761 10.2761 11 10 11C9.72386 11 9.5 10.7761 9.5 10.5Z"></path>
                <path
                    fillRule="evenodd"
                    clipRule="evenodd"
                    d="M8 1C6.5135 1 5.27952 2.08114 5.04148 3.5H2.5C1.67157 3.5 1 4.17157 1 5V11.5C1 13.433 2.567 15 4.5 15H11.5C13.433 15 15 13.433 15 11.5V5C15 4.17157 14.3284 3.5 13.5 3.5H10.9585C10.7205 2.08114 9.4865 1 8 1ZM8 2C7.06808 2 6.28503 2.63739 6.06301 3.5H9.93699C9.71497 2.63739 8.93192 2 8 2ZM6 6C5.17157 6 4.5 6.67157 4.5 7.5C4.5 8.32843 5.17157 9 6 9C6.82843 9 7.5 8.32843 7.5 7.5C7.5 6.67157 6.82843 6 6 6ZM10.8536 6.85355C11.0488 6.65829 11.0488 6.34171 10.8536 6.14645C10.6583 5.95118 10.3417 5.95118 10.1464 6.14645L5.14645 11.1464C4.95118 11.3417 4.95118 11.6583 5.14645 11.8536C5.34171 12.0488 5.65829 12.0488 5.85355 11.8536L10.8536 6.85355ZM10 9C9.17157 9 8.5 9.67157 8.5 10.5C8.5 11.3284 9.17157 12 10 12C10.8284 12 11.5 11.3284 11.5 10.5C11.5 9.67157 10.8284 9 10 9Z"
                ></path>
            </svg>
            {alt ? <span className="sr-only">{alt}</span> : null}
        </>
    );
};
