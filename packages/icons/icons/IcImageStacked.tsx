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

export const IcImageStacked = ({ alt, title, size = 4, className = '', viewBox = '0 0 16 16', ...rest }: IconProps) => {
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
                    d="M10.56 1.598a.32.32 0 0 0-.115.023l-8.32 3.2a.32.32 0 0 0-.205.299v6.72a.32.32 0 1 0 .64 0v-6.5l8.115-3.122a.32.32 0 0 0-.114-.62Zm1.6 1.28a.32.32 0 0 0-.115.023l-8.32 3.2a.32.32 0 0 0-.205.299v6.72a.32.32 0 1 0 .64 0v-6.5l8.115-3.122a.32.32 0 0 0-.114-.62Zm1.59 1.282a.32.32 0 0 0-.105.02l-8.32 3.2a.32.32 0 0 0-.205.3v7.04a.32.32 0 0 0 .435.298l8.32-3.2a.32.32 0 0 0 .205-.298V4.48a.32.32 0 0 0-.33-.32Zm-.31.786V11.3l-7.68 2.953V7.9l7.68-2.954Z"
                ></path>
            </svg>
            {alt ? <span className="sr-only">{alt}</span> : null}
        </>
    );
};
