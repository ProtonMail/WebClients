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

export const IcBrandProtonDrive = ({
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

                <path
                    fillRule="evenodd"
                    d="M1 4a2 2 0 0 1 2-2h1.028c.388 0 .77.09 1.118.264l1.155.578A1.5 1.5 0 0 0 6.972 3H13a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V4Zm2-1a1 1 0 0 0-1 1h1.894a2.5 2.5 0 0 1 1.387.42l.493.328A1.5 1.5 0 0 0 6.606 5H10a2 2 0 0 1 2 2v6h1a1 1 0 0 0 1-1V5a1 1 0 0 0-1-1H6.972a2.5 2.5 0 0 1-1.118-.264L4.7 3.158A1.5 1.5 0 0 0 4.028 3H3Zm8 10V7a1 1 0 0 0-1-1H6.606a2.5 2.5 0 0 1-1.387-.42l-.493-.328A1.5 1.5 0 0 0 3.894 5H2v7a1 1 0 0 0 1 1h8Z"
                ></path>
            </svg>
            {alt ? <span className="sr-only">{alt}</span> : null}
        </>
    );
};
