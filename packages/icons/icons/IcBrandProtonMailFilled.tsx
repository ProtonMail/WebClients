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

export const IcBrandProtonMailFilled = ({
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
                    d="M2.61 2.21a1 1 0 0 0-1.612.792v7.995a2 2 0 0 0 2 2h10.004a2 2 0 0 0 2-2V3.002a1 1 0 0 0-1.611-.791L8.306 6.143a.5.5 0 0 1-.612 0L2.61 2.21Zm-.612.792 5.084 3.932c.18.139.383.231.595.278l-.518.463a.9.9 0 0 1-1.165.03L1.998 4.487V3.002Zm11.004 8.995h-.817v-7.59l1.817-1.405v7.995a1 1 0 0 1-1 1Z"
                ></path>
            </svg>
            {alt ? <span className="sr-only">{alt}</span> : null}
        </>
    );
};
