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

export const IcLockOpenFilled2 = ({
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
                    d="M4 1a4 4 0 0 0-4 4v.5a.5.5 0 0 0 1 0V5a3 3 0 0 1 6 0c-.988 0-1.506.013-1.908.218a2 2 0 0 0-.874.874C4 6.52 4 7.08 4 8.2v3.6c0 1.12 0 1.68.218 2.108a2 2 0 0 0 .874.874C5.52 15 6.08 15 7.2 15h5.6c1.12 0 1.68 0 2.108-.218a2 2 0 0 0 .874-.874C16 13.48 16 12.92 16 11.8V8.2c0-1.12 0-1.68-.218-2.108a2 2 0 0 0-.874-.874C14.48 5 13.92 5 12.8 5H8a4 4 0 0 0-4-4Zm6.47 8.883a1 1 0 1 0-.94 0l-.437 1.744a.3.3 0 0 0 .291.373h1.232a.3.3 0 0 0 .29-.373l-.435-1.744Z"
                ></path>
            </svg>
            {alt ? <span className="sr-only">{alt}</span> : null}
        </>
    );
};
