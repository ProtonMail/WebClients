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

export const IcLinkSlash = ({ alt, title, size = 4, className = '', viewBox = '0 0 16 16', ...rest }: IconProps) => {
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
                    d="M14.854 14.797a.502.502 0 0 1-.708 0l-6.5-6.473-6.5-6.473a.498.498 0 0 1 0-.706.502.502 0 0 1 .708 0L8 7.265l1.413-1.407a.503.503 0 0 1 .709 0 .498.498 0 0 1 0 .706L8.709 7.97l6.145 6.12a.498.498 0 0 1 0 .706ZM9.022 2.022a3.511 3.511 0 0 1 4.952 0 3.477 3.477 0 0 1 0 4.93L11.536 9.38a.502.502 0 0 1-.708 0 .497.497 0 0 1 0-.706l2.437-2.427a2.481 2.481 0 0 0 0-3.52 2.506 2.506 0 0 0-3.534 0L7.294 5.156a.502.502 0 0 1-.709 0 .498.498 0 0 1 0-.706l2.437-2.427ZM7.21 9.465l-.355.353-.268.267a.502.502 0 0 1-.709 0 .497.497 0 0 1 0-.705l.269-.268.354-.353.709.706ZM2.09 13.98a3.51 3.51 0 0 0 4.876.072l2.12-1.99.365-.343-.688-.726-.364.342-2.12 1.99c-.984.923-2.525.9-3.48-.05a2.48 2.48 0 0 1 .053-3.57l1.991-1.869.365-.342-.687-.726-.365.342-1.991 1.87a3.475 3.475 0 0 0-.075 5Z"
                ></path>
            </svg>
            {alt ? <span className="sr-only">{alt}</span> : null}
        </>
    );
};
