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

export const IcBroom = ({ alt, title, size = 4, className = '', viewBox = '0 0 16 16', ...rest }: IconProps) => {
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
                    d="M13 15H5.2a.2.2 0 0 1-.2-.2v-1.267a.01.01 0 0 0-.018-.005l-.004.005-.546.82-.299.447-.074.11a.2.2 0 0 1-.166.09H2V8a2 2 0 0 1 2-2h2V2a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v4h2a2 2 0 0 1 2 2v7h-1Zm0-1H6v-.467c0-1-1.296-1.392-1.85-.56L3.465 14H3v-4h10v4Zm0-5H3V8a1 1 0 0 1 1-1h3V2h2v5h3a1 1 0 0 1 1 1v1Z"
                ></path>
            </svg>
            {alt ? <span className="sr-only">{alt}</span> : null}
        </>
    );
};
