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

export const IcSwitchOff = ({ alt, title, size = 4, className = '', viewBox = '0 0 16 16', ...rest }: IconProps) => {
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
                    d="M5.025 1h-.314A.705.705 0 0 0 4 1.7v6.8h.008A.986.986 0 0 0 4 8.627V14c0 .552.454 1 1.015 1h5.583c.56 0 1.015-.448 1.015-1V8.646l3.275-5.07a.698.698 0 0 0-.405-1.05L11.909 1.09A.72.72 0 0 0 11.56 1H5.026Zm7.35 1.5L11.48 2H6.942l.897.5h4.537Zm-5.471.628L5.015 2.075v4.464l1.889-3.411Zm6.83.372h-5.88L5.015 8.627M13.734 3.5l-2.977 4.609a.989.989 0 0 0-.16.537V14H5.016V8.627m-.022-.012L4.778 8.5Zm5.379-3.531a.495.495 0 0 1 .14.693l-1.014 1.5a.512.512 0 0 1-.704.139.495.495 0 0 1-.141-.693l1.015-1.5a.512.512 0 0 1 .704-.14ZM8.06 11a.504.504 0 0 0-.507.5c0 .276.227.5.507.5s.508-.224.508-.5-.227-.5-.508-.5Zm-1.522.5c0-.829.681-1.5 1.522-1.5s1.523.671 1.523 1.5c0 .828-.682 1.5-1.523 1.5-.84 0-1.522-.672-1.522-1.5Z"
                ></path>
            </svg>
            {alt ? <span className="sr-only">{alt}</span> : null}
        </>
    );
};
