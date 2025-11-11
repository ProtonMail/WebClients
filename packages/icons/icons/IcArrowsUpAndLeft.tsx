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

export const IcArrowsUpAndLeft = ({
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
                    d="m5.66 6.999 2.693-2.646a.496.496 0 0 0 .004-.705.504.504 0 0 0-.71-.004L4.23 7.002a.695.695 0 0 0 0 .993l3.419 3.358a.504.504 0 0 0 .709-.004.496.496 0 0 0-.004-.705L5.66 7.999h6.837a1.5 1.5 0 0 1 1.5 1.5v2.5a.5.5 0 1 0 1 0v-2.5a2.5 2.5 0 0 0-2.5-2.5H5.66Zm-3.525.5 3.217-3.145a.496.496 0 0 0 .006-.705.504.504 0 0 0-.71-.006L1.213 7.001a.695.695 0 0 0 0 .995l3.435 3.358c.198.193.515.19.71-.006a.496.496 0 0 0-.006-.705L2.135 7.5Z"
                ></path>
            </svg>
            {alt ? <span className="sr-only">{alt}</span> : null}
        </>
    );
};
