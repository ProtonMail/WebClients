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

export const IcMagicWand = ({ alt, title, size = 4, className = '', viewBox = '0 0 16 16', ...rest }: IconProps) => {
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
                    d="m7.29.142-.268.67a.377.377 0 0 1-.21.21l-.67.268a.226.226 0 0 0 0 .42l.67.268a.377.377 0 0 1 .21.21l.268.67c.076.19.344.19.42 0l.268-.67a.377.377 0 0 1 .21-.21l.67-.268a.226.226 0 0 0 0-.42l-.67-.268a.377.377 0 0 1-.21-.21L7.71.142a.226.226 0 0 0-.42 0ZM11.793 1.5a1 1 0 0 1 1.414 0l1.414 1.414a1 1 0 0 1 0 1.414l-9.9 9.9a1 1 0 0 1-1.413 0l-1.415-1.414a1 1 0 0 1 0-1.415l9.9-9.899Zm.707.707-1.817 1.817 1.435 1.393 1.796-1.796L12.5 2.207Zm-9.9 9.9L9.977 4.73l1.435 1.394-7.396 7.396L2.6 12.107Zm.84-8.073-1.177.504a.668.668 0 0 1-.526 0L.56 4.034a.4.4 0 0 0-.526.526l.504 1.177a.668.668 0 0 1 0 .526L.034 7.44a.4.4 0 0 0 .526.526l1.177-.504a.668.668 0 0 1 .526 0l1.177.504a.4.4 0 0 0 .526-.526l-.504-1.177a.668.668 0 0 1 0-.526l.504-1.177a.4.4 0 0 0-.526-.526Zm8.264 7.32.446-1.117a.376.376 0 0 1 .7 0l.447 1.117c.063.16.19.286.349.35l1.117.446a.376.376 0 0 1 0 .7l-1.117.447a.627.627 0 0 0-.35.349l-.446 1.117a.376.376 0 0 1-.7 0l-.447-1.117a.627.627 0 0 0-.349-.35l-1.117-.446a.376.376 0 0 1 0-.7l1.117-.447a.627.627 0 0 0 .35-.349Z"
                ></path>
            </svg>
            {alt ? <span className="sr-only">{alt}</span> : null}
        </>
    );
};
