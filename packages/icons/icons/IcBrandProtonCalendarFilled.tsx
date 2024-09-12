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

export const IcBrandProtonCalendarFilled = ({
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
                    d="M2.5 3h11a.5.5 0 0 1 .5.5V8h-2V5.5A1.5 1.5 0 0 0 10.5 4H2v-.5a.5.5 0 0 1 .5-.5ZM1 3.5v9A1.5 1.5 0 0 0 2.5 14H10v-3.5A1.5 1.5 0 0 1 11.5 9H15V3.5A1.5 1.5 0 0 0 13.5 2h-11A1.5 1.5 0 0 0 1 3.5ZM8 13v-.879a1 1 0 0 1 .293-.707L9 10.707V13H8Z"
                ></path>
            </svg>
            {alt ? <span className="sr-only">{alt}</span> : null}
        </>
    );
};
