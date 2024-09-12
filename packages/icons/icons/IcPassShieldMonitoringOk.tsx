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

export const IcPassShieldMonitoringOk = ({
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

                <path d="M7.83874 1.16282C8.08997 1.27744 8.20073 1.57402 8.08611 1.82525L7.30347 3.54078C7.18886 3.79201 6.89228 3.90276 6.64104 3.78815C6.38981 3.67353 6.27906 3.37695 6.39368 3.12572L6.6753 2.50841L6.44684 2.59372L6.44933 2.59678L6.04289 2.74457L5.30796 3.01902C5.28022 3.02938 5.25214 3.03711 5.22399 3.04235L3 3.85108V9.12633C3 10.4071 3.6996 11.5857 4.82402 12.199L7.02203 13.3979C6.82755 13.7283 6.74602 14.0799 6.77746 14.4036L4.34517 13.0769C2.89949 12.2883 2 10.7731 2 9.12633V3.50086C2 3.29061 2.13153 3.10282 2.32913 3.03097L5.69712 1.80624L6.32546 1.5716L5.70816 1.28998C5.45692 1.17537 5.34617 0.878787 5.46079 0.627554C5.5754 0.376321 5.87198 0.26557 6.12321 0.380185L7.83874 1.16282Z"></path>
                <path d="M9.96924 1.68492C9.90867 2.02673 9.76128 2.33855 9.55067 2.59678L13 3.85108V9.12633C13 10.4071 12.3004 11.5857 11.176 12.199L10.7988 12.4047C10.7775 12.4129 10.7565 12.4228 10.7359 12.4342L10.2424 12.7082L9.82433 12.9362L9.82715 12.9388L9.45987 13.1427L9.64643 12.4903C9.72235 12.2248 9.56867 11.9481 9.30317 11.8721C9.03767 11.7962 8.76089 11.9499 8.68497 12.2154L8.16652 14.0283C8.09059 14.2938 8.24428 14.5706 8.50977 14.6465L10.3227 15.165C10.5882 15.2409 10.865 15.0872 10.9409 14.8217C11.0168 14.5562 10.8632 14.2794 10.5977 14.2035L9.94531 14.017L10.7246 13.5843L11.6548 13.0769C13.1005 12.2883 14 10.7731 14 9.12633V3.50086C14 3.29061 13.8685 3.10282 13.6709 3.03097L9.96924 1.68492Z"></path>
                <path d="M10.7494 5.61071C10.9025 5.38094 10.8404 5.07051 10.6107 4.91733C10.3809 4.76416 10.0705 4.82624 9.91731 5.05601L7.58895 8.54854L6.35355 7.31314C6.15829 7.11788 5.84171 7.11788 5.64645 7.31314C5.45118 7.5084 5.45118 7.82498 5.64645 8.02024L7.31311 9.68691C7.41904 9.79283 7.56687 9.84569 7.71594 9.83092C7.865 9.81616 7.9996 9.73535 8.08269 9.61071L10.7494 5.61071Z"></path>
            </svg>
            {alt ? <span className="sr-only">{alt}</span> : null}
        </>
    );
};
