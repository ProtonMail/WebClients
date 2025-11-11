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

export const IcPaperPlaneClock = ({
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
                    d="M2.66147 5.97921L12.6717 2.63619L6.76377 8.53657L2.66147 5.97921ZM7.53896 9.36272L7.46689 9.24766L7.85624 8.85881C8.13665 8.47262 8.47696 8.13275 8.86352 7.85282L13.3513 3.37084L12.1284 7.04353C12.4655 7.09062 12.7906 7.17507 13.0994 7.29254L14.9734 1.66459C15.1045 1.27075 14.7289 0.895619 14.3345 1.02659L1.34469 5.36468C0.939921 5.4991 0.875513 6.04376 1.23764 6.27L6.26434 9.40363C6.39437 9.48486 6.50421 9.59457 6.58555 9.72442L7.10102 10.5474C7.19146 10.1278 7.34043 9.72988 7.53896 9.36272Z"
                ></path>
                <path
                    fillRule="evenodd"
                    d="M11.5 15C13.433 15 15 13.433 15 11.5C15 9.567 13.433 8 11.5 8C9.567 8 8 9.567 8 11.5C8 13.433 9.567 15 11.5 15ZM12 9.5C12 9.22386 11.7761 9 11.5 9C11.2239 9 11 9.22386 11 9.5V11.7071L12.1464 12.8536C12.3417 13.0488 12.6583 13.0488 12.8536 12.8536C13.0488 12.6583 13.0488 12.3417 12.8536 12.1464L12 11.2929V9.5Z"
                ></path>
            </svg>
            {alt ? <span className="sr-only">{alt}</span> : null}
        </>
    );
};
