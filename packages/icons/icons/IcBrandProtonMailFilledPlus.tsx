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

export const IcBrandProtonMailFilledPlus = ({
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

                <g>
                    <path
                        fillRule="evenodd"
                        d="M2.087 3.369A.8.8 0 0 0 .798 4v6.396a1.6 1.6 0 0 0 1.6 1.6h8.004a1.6 1.6 0 0 0 1.6-1.6V9.6h-.8v.797a.8.8 0 0 1-.8.8h-.654V5.126L11.202 4v1.6h.8V4a.8.8 0 0 0-1.29-.632L6.645 6.514a.4.4 0 0 1-.49 0L2.087 3.37ZM1.598 4l4.068 3.146c.144.111.306.185.475.223l-.414.37a.72.72 0 0 1-.931.024L1.598 5.19V4Z"
                    ></path>
                    <path d="M12.8 5.2a.4.4 0 0 1 .8 0v2h2a.4.4 0 0 1 0 .8h-2v2a.4.4 0 1 1-.8 0V8h-2a.4.4 0 0 1 0-.8h2v-2Z"></path>
                </g>
            </svg>
            {alt ? <span className="sr-only">{alt}</span> : null}
        </>
    );
};
