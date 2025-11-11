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

export const IcBrandIos = ({ alt, title, size = 4, className = '', viewBox = '0 0 16 16', ...rest }: IconProps) => {
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
                    d="M1.065 11.36h1.158V6.43H1.065v4.929Zm.577-5.575a.632.632 0 0 0 .646-.628.633.633 0 0 0-.646-.632.632.632 0 0 0-.642.632c0 .349.284.628.642.628Zm4.435-1.246c-1.957 0-3.185 1.334-3.185 3.468 0 2.135 1.228 3.464 3.185 3.464 1.953 0 3.18-1.33 3.18-3.464S8.03 4.54 6.078 4.54Zm0 1.023c1.195 0 1.958.948 1.958 2.445 0 1.493-.763 2.441-1.958 2.441-1.2 0-1.957-.948-1.957-2.44 0-1.498.758-2.446 1.957-2.446Zm3.669 3.91c.051 1.237 1.065 2 2.608 2 1.623 0 2.646-.8 2.646-2.074 0-1-.576-1.563-1.939-1.874l-.772-.177c-.823-.195-1.162-.455-1.162-.902 0-.558.511-.93 1.27-.93.767 0 1.292.377 1.348 1.005h1.143c-.027-1.181-1.004-1.981-2.482-1.981-1.46 0-2.497.804-2.497 1.995 0 .957.586 1.552 1.822 1.836l.87.205c.846.2 1.19.479 1.19.962 0 .558-.563.958-1.372.958-.818 0-1.436-.405-1.51-1.023H9.745Z"
                ></path>
            </svg>
            {alt ? <span className="sr-only">{alt}</span> : null}
        </>
    );
};
