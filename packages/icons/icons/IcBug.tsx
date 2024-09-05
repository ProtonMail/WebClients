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

export const IcBug = ({ alt, title, size = 4, className = '', viewBox = '0 0 16 16', ...rest }: IconProps) => {
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
                    d="M10.443 3.258c.16.226.29.476.385.742H13v1.947c.825 0 1.5-.674 1.5-1.512a.5.5 0 0 1 1 0A2.506 2.506 0 0 1 13 6.948V8h2a.5.5 0 0 1 0 1h-2v1c0 .337-.037.665-.107.981H13c1.384 0 2.5 1.128 2.5 2.513a.5.5 0 0 1-1 0c0-.838-.675-1.513-1.5-1.513h-.459C11.81 13.473 10.531 15 8 15c-2.443 0-3.809-1.527-4.541-3.019H3c-.826 0-1.5.675-1.5 1.513a.5.5 0 0 1-1 0A2.506 2.506 0 0 1 3 10.98h.107A4.516 4.516 0 0 1 3 10V9H1a.5.5 0 0 1 0-1h2V6.947A2.506 2.506 0 0 1 .5 4.435a.5.5 0 0 1 1 0c0 .838.674 1.513 1.5 1.513V4H5.172c.094-.266.225-.516.385-.742L4.233 1.926a.504.504 0 0 1 0-.71.496.496 0 0 1 .705 0l1.324 1.332c.49-.352 1.09-.56 1.738-.56.648 0 1.248.208 1.738.56l1.324-1.332a.496.496 0 0 1 .705 0 .504.504 0 0 1 0 .71l-1.324 1.332ZM6 5.006H5V5H4v5c0 1.933 1.557 4 4 4s4-2.067 4-4V5h-1v.006H6ZM9.732 4A2.003 2.003 0 0 0 8 2.988c-.736 0-1.385.407-1.732 1.012h3.464Z"
                ></path>
            </svg>
            {alt ? <span className="sr-only">{alt}</span> : null}
        </>
    );
};
