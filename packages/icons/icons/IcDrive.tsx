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

export const IcDrive = ({ alt, title, size = 4, className = '', viewBox = '0 0 16 16', ...rest }: IconProps) => {
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
                    d="M14 12v-2a1 1 0 0 0-1-1H3a1 1 0 0 0-1 1v2a1 1 0 0 0 1 1h10a1 1 0 0 0 1-1Zm1 0V9.41a2 2 0 0 0-.162-.787l-2.318-5.41A2 2 0 0 0 10.68 2H5.32A2 2 0 0 0 3.48 3.212l-2.32 5.41A2 2 0 0 0 1 9.412V12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2Zm-3.4-8.394 1.912 4.46A2.004 2.004 0 0 0 13 8H3c-.177 0-.348.023-.512.066L4.4 3.606A1 1 0 0 1 5.319 3h5.362a1 1 0 0 1 .92.606Zm.9 7.894a.5.5 0 1 0 0-1 .5.5 0 0 0 0 1Z"
                ></path>
            </svg>
            {alt ? <span className="sr-only">{alt}</span> : null}
        </>
    );
};
