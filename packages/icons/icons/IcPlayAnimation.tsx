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

export const IcPlayAnimation = ({
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
                    d="M6.5 6.00124C6.5 5.58573 6.97682 5.35095 7.30616 5.60429L9.90454 7.60302C10.1652 7.80349 10.1652 8.19645 9.90454 8.39692L7.30616 10.3957C6.97682 10.649 6.5 10.4142 6.5 9.9987V6.00124Z"
                    clipRule="evenodd"
                ></path>
                <path d="M1 8C1 7.24293 1.12117 6.51337 1.34375 5.83008C1.4294 5.56772 1.71215 5.42427 1.97461 5.50977C2.23697 5.59542 2.38042 5.87817 2.29492 6.14062C2.10427 6.72601 2 7.35051 2 8C2 11.3137 4.68629 14 8 14C11.3137 14 14 11.3137 14 8C14 4.68629 11.3137 2 8 2C7.35051 2 6.72601 2.10427 6.14062 2.29492C5.87817 2.38042 5.59542 2.23697 5.50977 1.97461C5.42427 1.71215 5.56772 1.4294 5.83008 1.34375C6.51337 1.12117 7.24293 1 8 1C11.866 1 15 4.13401 15 8C15 11.866 11.866 15 8 15C4.13401 15 1 11.866 1 8Z"></path>
                <path d="M4.5 3.5C4.5 4.05228 4.05228 4.5 3.5 4.5C2.94772 4.5 2.5 4.05228 2.5 3.5C2.5 2.94772 2.94772 2.5 3.5 2.5C4.05228 2.5 4.5 2.94772 4.5 3.5Z"></path>
            </svg>
            {alt ? <span className="sr-only">{alt}</span> : null}
        </>
    );
};
