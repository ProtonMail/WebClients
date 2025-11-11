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

export const IcHeartFilled = ({ alt, title, size = 4, className = '', viewBox = '0 0 16 16', ...rest }: IconProps) => {
    return (
        <>
            {/* eslint-disable-next-line jsx-a11y/prefer-tag-over-role */}
            <svg
                viewBox={viewBox}
                className={`icon-size-${size} ${className}`}
                role="img"
                focusable="false"
                aria-hidden="true"
                {...rest}
            >
                {title ? <title>{title}</title> : null}

                <path d="M7.89165 3.18448C6.29476 1.5876 3.70569 1.58759 2.1088 3.18448C0.546012 4.74727 0.507816 7.26902 2.02255 8.87843L7.63613 14.8428C7.73061 14.9432 7.86236 15.0002 8.00023 15.0002C8.13809 15.0002 8.26984 14.9432 8.36432 14.8428L13.9779 8.87843C15.4926 7.26902 15.4544 4.74727 13.8916 3.18448C12.2948 1.58759 9.70569 1.5876 8.1088 3.18448L8.00022 3.29306L7.89165 3.18448Z"></path>
            </svg>
            {alt ? <span className="sr-only">{alt}</span> : null}
        </>
    );
};
