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

export const IcGlobe = ({ alt, title, size = 4, className = '', viewBox = '0 0 16 16', ...rest }: IconProps) => {
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
                    d="M4.012 8H2.02a6.504 6.504 0 0 1 3.805-5.425 7.143 7.143 0 0 0-.591.917C4.539 4.764 4.09 6.39 4.013 8Zm0 1H2.02a6.504 6.504 0 0 0 3.805 5.425 7.14 7.14 0 0 1-.591-.917C4.539 12.236 4.09 10.61 4.013 9ZM8 14.917c-.664-.219-1.331-.864-1.89-1.888C5.5 11.908 5.092 10.451 5.014 9H8v5.917Zm3.176-.492c.217-.284.415-.593.591-.917.694-1.272 1.143-2.897 1.22-4.508h1.994a6.504 6.504 0 0 1-3.805 5.425ZM11.986 9c-.077 1.451-.485 2.908-1.097 4.03-.558 1.023-1.225 1.668-1.889 1.887V9h2.986Zm1.002-1h1.993a6.504 6.504 0 0 0-3.805-5.425c.217.284.415.593.591.917.694 1.272 1.143 2.897 1.22 4.508ZM9 2.083c.664.219 1.331.865 1.89 1.888.61 1.121 1.019 2.578 1.096 4.029H9V2.083Zm-1 0V8H5.013c.078-1.451.486-2.908 1.098-4.03C6.669 2.949 7.336 2.303 8 2.084ZM8.5 1a7.5 7.5 0 1 0 0 15 7.5 7.5 0 0 0 0-15Z"
                ></path>
            </svg>
            {alt ? <span className="sr-only">{alt}</span> : null}
        </>
    );
};
