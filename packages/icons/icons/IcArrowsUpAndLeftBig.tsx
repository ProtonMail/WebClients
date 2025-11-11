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

export const IcArrowsUpAndLeftBig = ({
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
                    d="M8.132 2.147a.5.5 0 0 1 .854.353v3.022c.488.036 1.288.127 2.163.366 1.066.29 2.294.814 3.189 1.77.993 1.061 1.397 2.473 1.558 3.61.163 1.146.09 2.082.073 2.255a.507.507 0 0 1-.916.255c-2.203-2.953-4.994-3.287-6.067-3.298v3.02a.5.5 0 0 1-.854.353l-5.486-5.5a.5.5 0 0 1 0-.706l5.486-5.5ZM7.986 5.8V3.71L3.706 8l4.28 4.29v-2.113c0-.35.266-.67.65-.69.792-.04 3.764.007 6.345 2.666a9.373 9.373 0 0 0-.075-.744c-.149-1.049-.508-2.223-1.298-3.067-.715-.764-1.74-1.221-2.722-1.49a10.53 10.53 0 0 0-2.224-.347.706.706 0 0 1-.676-.705ZM5.632 2.147a.5.5 0 0 1 .708.706L1.206 8l5.134 5.147a.5.5 0 0 1-.708.706l-5.486-5.5a.5.5 0 0 1 0-.706l5.486-5.5Z"
                ></path>
            </svg>
            {alt ? <span className="sr-only">{alt}</span> : null}
        </>
    );
};
