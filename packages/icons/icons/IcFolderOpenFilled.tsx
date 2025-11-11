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

export const IcFolderOpenFilled = ({
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

                <path d="M1.5 2A1.5 1.5 0 0 0 0 3.5v8.536c.023-.07.051-.139.085-.207l2.5-5A1.5 1.5 0 0 1 3.927 6H13V4.5A1.5 1.5 0 0 0 11.5 3H6.618l-1.683-.842A1.5 1.5 0 0 0 4.264 2H1.5Z"></path>
                <path d="M.98 12.276a.515.515 0 0 0-.019.041l-.106.187A1 1 0 0 0 1.723 14h9.697a1 1 0 0 0 .868-.504l3.07-5.374A.75.75 0 0 0 14.709 7H3.927a.5.5 0 0 0-.447.276l-2.5 5Z"></path>
            </svg>
            {alt ? <span className="sr-only">{alt}</span> : null}
        </>
    );
};
