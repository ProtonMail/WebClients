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

export const IcArrowRightArrowLeft = ({
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
                    d="M1.206 11.002a.699.699 0 0 0 0 .992l1.99 1.98a.5.5 0 0 0 .705-.709L2.63 12h11.868a.5.5 0 0 0 .002-1H2.626l1.275-1.269a.5.5 0 0 0-.705-.708l-1.99 1.98ZM1 4.5a.5.5 0 0 0 .5.5h11.872l-1.273 1.267a.5.5 0 1 0 .705.709l1.99-1.98a.699.699 0 0 0 0-.992l-1.99-1.98a.5.5 0 0 0-.705.709L13.372 4H1.5a.5.5 0 0 0-.5.5Z"
                ></path>
            </svg>
            {alt ? <span className="sr-only">{alt}</span> : null}
        </>
    );
};
