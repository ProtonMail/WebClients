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

export const IcBrandSimpleLogin = ({
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
                    d="M8 2.133c-.05 0-.077.021-.087.034-1.432 1.91-3.78 2.67-4.99 2.836a.08.08 0 0 0-.045.023.033.033 0 0 0-.006.009c.065 2.907.795 4.905 1.756 6.272a6.95 6.95 0 0 0 3.253 2.54c.077.029.161.029.238 0a6.95 6.95 0 0 0 3.253-2.54c.96-1.367 1.69-3.365 1.756-6.272a.032.032 0 0 0-.006-.009.079.079 0 0 0-.046-.023c-1.21-.166-3.557-.926-4.989-2.836-.01-.013-.037-.034-.087-.034Zm-.785-.489c.383-.51 1.187-.51 1.57 0 1.24 1.654 3.328 2.346 4.41 2.496.424.058.816.42.805.914-.069 3.048-.837 5.221-1.915 6.754a7.822 7.822 0 0 1-3.658 2.854 1.208 1.208 0 0 1-.854 0 7.822 7.822 0 0 1-3.658-2.854C2.837 10.275 2.069 8.102 2 5.054c-.01-.495.38-.856.805-.914 1.083-.15 3.17-.842 4.41-2.496Z"
                ></path>
                <path
                    fillRule="evenodd"
                    d="M7.952 12.746c.032.01.064.01.095 0 1.307-.408 3.8-2.287 3.926-6.724.005-.192-.152-.351-.342-.38-.816-.123-2.332-.64-3.275-1.874a.463.463 0 0 0-.712 0c-.943 1.234-2.46 1.75-3.275 1.874-.19.029-.347.188-.342.38.125 4.437 2.619 6.316 3.925 6.724Zm2.88-5.402-.741-.753-2.494 2.45-1.283-1.225-.73.764 2.023 1.932 3.224-3.168Z"
                ></path>
            </svg>
            {alt ? <span className="sr-only">{alt}</span> : null}
        </>
    );
};
