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

export const IcMeetUser = ({ alt, title, size = 4, className = '', viewBox = '0 0 16 16', ...rest }: IconProps) => {
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
                    d="M96.2825 84.3574C89.395 88.2499 81.46 90.4999 73 90.4999C64.54 90.4999 56.605 88.2499 49.7175 84.3574C21.13 94.0799 0.5 121.167 0.5 153C0.5 154.38 1.62 155.5 3 155.5H143C144.38 155.5 145.5 154.38 145.5 153C145.5 121.167 124.87 94.0799 96.2825 84.3574Z"
                    fill="currentColor"
                ></path>
                <path
                    d="M73 0.5C49.565 0.5 30.5 19.565 30.5 43C30.5 66.435 49.565 85.5 73 85.5C96.435 85.5 115.5 66.435 115.5 43C115.5 19.565 96.435 0.5 73 0.5Z"
                    fill="currentColor"
                ></path>
            </svg>
            {alt ? <span className="sr-only">{alt}</span> : null}
        </>
    );
};
