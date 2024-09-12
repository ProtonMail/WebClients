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

export const IcArrowUpAndRightBig = ({
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
                    d="M8.313 2.042a.5.5 0 0 1 .54.09l5.985 5.5a.5.5 0 0 1 0 .736l-5.986 5.5a.5.5 0 0 1-.838-.368v-3.02c-1.073.011-3.864.345-6.067 3.298a.512.512 0 0 1-.758.07.508.508 0 0 1-.158-.325c-.016-.173-.09-1.109.073-2.255.161-1.137.565-2.549 1.558-3.61.895-.956 2.123-1.48 3.19-1.77.874-.239 1.674-.33 2.162-.366V2.5a.5.5 0 0 1 .3-.458Zm.701 1.596V5.8a.706.706 0 0 1-.676.705 10.53 10.53 0 0 0-2.224.348c-.981.268-2.007.725-2.722 1.489-.79.844-1.15 2.018-1.298 3.067a9.393 9.393 0 0 0-.075.744C4.6 9.494 7.572 9.447 8.364 9.487c.384.02.65.34.65.69v2.185L13.761 8 9.014 3.638Z"
                ></path>
            </svg>
            {alt ? <span className="sr-only">{alt}</span> : null}
        </>
    );
};
