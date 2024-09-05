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

export const IcLockExclamationFilled = ({
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
                    d="M4.2 5H4v-.5a2.5 2.5 0 0 1 5 0V5H4.2Zm-2.108.218c.238-.121.516-.175.908-.199V4.5a3.5 3.5 0 1 1 7 0v.52c.392.023.67.077.908.198a2 2 0 0 1 .833.798 1.8 1.8 0 0 0-1.804.89L6.265 13.15A1.96 1.96 0 0 0 6.213 15H4.2c-1.12 0-1.68 0-2.108-.218a2 2 0 0 1-.874-.874C1 13.48 1 12.92 1 11.8V8.2c0-1.12 0-1.68.218-2.108a2 2 0 0 1 .874-.874ZM12.2 7.413a.801.801 0 0 0-1.4 0l-3.673 6.244c-.344.585.052 1.343.7 1.343h7.346c.648 0 1.044-.758.7-1.343l-3.672-6.244ZM12 9.5a.5.5 0 0 0-1 0V12a.5.5 0 0 0 1 0V9.5Zm-.5 3.5a.5.5 0 0 1 .5.5v.005a.5.5 0 1 1-1 0V13.5a.5.5 0 0 1 .5-.5Z"
                ></path>
            </svg>
            {alt ? <span className="sr-only">{alt}</span> : null}
        </>
    );
};
