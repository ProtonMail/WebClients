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

export const IcLockOpenExclamationFilled = ({
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
                    d="M8.239 2.935A2.358 2.358 0 0 0 4 4.358V5h4.8c1.12 0 1.68 0 2.108.218a2 2 0 0 1 .833.798 1.8 1.8 0 0 0-1.804.89L6.265 13.15A1.96 1.96 0 0 0 6.213 15H4.2c-1.12 0-1.68 0-2.108-.218a2 2 0 0 1-.874-.874C1 13.48 1 12.92 1 11.8V8.2c0-1.12 0-1.68.218-2.108a2 2 0 0 1 .874-.874c.238-.121.516-.175.908-.199v-.66A3.358 3.358 0 0 1 9.036 2.33l.363.48a.5.5 0 1 1-.798.603l-.362-.479ZM12.2 7.413a.801.801 0 0 0-1.4 0l-3.673 6.244c-.344.585.052 1.343.7 1.343h7.346c.648 0 1.044-.758.7-1.343l-3.672-6.244ZM12 9.5a.5.5 0 0 0-1 0V12a.5.5 0 0 0 1 0V9.5Zm-.5 3.5a.5.5 0 0 1 .5.5v.005a.5.5 0 1 1-1 0V13.5a.5.5 0 0 1 .5-.5Z"
                ></path>
            </svg>
            {alt ? <span className="sr-only">{alt}</span> : null}
        </>
    );
};
