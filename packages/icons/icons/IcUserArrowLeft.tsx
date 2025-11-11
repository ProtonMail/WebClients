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

export const IcUserArrowLeft = ({
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
                    d="M10 5a2 2 0 1 1-4 0 2 2 0 0 1 4 0Zm1 0a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm-6.697 5.6a1.5 1.5 0 0 1 1.2-.6H9V9H5.503a2.5 2.5 0 0 0-2 1l-1.2 1.6c-.742.989-.036 2.4 1.2 2.4H9v-1H3.503a.5.5 0 0 1-.4-.8l1.2-1.6ZM15 11.5a.5.5 0 0 0-.5-.5h-3.793l1.147-1.146a.5.5 0 0 0-.708-.708l-1.858 1.859a.7.7 0 0 0 0 .99l1.858 1.859a.5.5 0 0 0 .708-.708L10.707 12H14.5a.5.5 0 0 0 .5-.5Z"
                ></path>
            </svg>
            {alt ? <span className="sr-only">{alt}</span> : null}
        </>
    );
};
