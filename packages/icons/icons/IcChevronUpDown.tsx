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

export const IcChevronUpDown = ({
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

                <path d="M10.6464 6.35348C10.8417 6.54874 11.1583 6.54874 11.3536 6.35348C11.5488 6.15822 11.5488 5.84163 11.3536 5.64637L8.70711 2.99992C8.31658 2.6094 7.68342 2.6094 7.29289 2.99992L4.64645 5.64637C4.45118 5.84163 4.45118 6.15822 4.64645 6.35348C4.84171 6.54874 5.15829 6.54874 5.35355 6.35348L8 3.70703L10.6464 6.35348Z"></path>
                <path d="M5.35356 9.64652C5.15829 9.45126 4.84171 9.45126 4.64645 9.64652C4.45119 9.84178 4.45119 10.1584 4.64645 10.3536L7.29289 13.0001C7.68342 13.3906 8.31658 13.3906 8.70711 13.0001L11.3536 10.3536C11.5488 10.1584 11.5488 9.84178 11.3536 9.64652C11.1583 9.45126 10.8417 9.45126 10.6464 9.64652L8 12.293L5.35356 9.64652Z"></path>
            </svg>
            {alt ? <span className="sr-only">{alt}</span> : null}
        </>
    );
};
