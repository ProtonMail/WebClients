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

export const IcBell2 = ({ alt, title, size = 4, className = '', viewBox = '0 0 16 16', ...rest }: IconProps) => {
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

                <path d="M10 13a2 2 0 1 1-4 0h4Z"></path>
                <path
                    fillRule="evenodd"
                    d="M14.102 11.995 14 12H2a1 1 0 0 1-1-1c0-1.072.574-1.57 1.108-2.03.461-.4.892-.774.892-1.47C3 4.5 3.5 1 8 1s5 3.5 5 6.5l.006.137c.052.61.456.96.886 1.332C14.427 9.431 15 9.93 15 11l-.005.102a1 1 0 0 1-.893.893Zm-.266-1.65c.09.145.164.338.164.655H2l.013-.216c.025-.195.084-.33.151-.44.103-.167.254-.318.494-.529l.113-.096C3.211 9.347 4 8.679 4 7.5c0-1.489.134-2.886.688-3.894.265-.48.621-.864 1.116-1.136C6.304 2.194 7.004 2 8 2c.996 0 1.696.194 2.196.47.495.272.851.656 1.116 1.136C11.866 4.614 12 6.011 12 7.5c0 1.179.79 1.847 1.229 2.219l.113.096c.24.211.391.362.494.53Z"
                    clipRule="evenodd"
                ></path>
            </svg>
            {alt ? <span className="sr-only">{alt}</span> : null}
        </>
    );
};
