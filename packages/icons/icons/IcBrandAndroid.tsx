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

export const IcBrandAndroid = ({ alt, title, size = 4, className = '', viewBox = '0 0 16 16', ...rest }: IconProps) => {
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
                    d="M11.203 9.43a.59.59 0 0 1-.596-.265.613.613 0 0 1 0-.662.59.59 0 0 1 .596-.266.602.602 0 0 1 .495.597c0 .295-.209.547-.495.596Zm-6.373 0a.594.594 0 0 1-.55-.377.612.612 0 0 1 .136-.661.587.587 0 0 1 .653-.12.606.606 0 0 1 .356.57.6.6 0 0 1-.595.588Zm6.604-3.091 1.073-2.016a.222.222 0 0 0-.082-.302.23.23 0 0 0-.298.1l-1.106 2.033A7.013 7.013 0 0 0 8 5.482a7.629 7.629 0 0 0-3.038.639l-1.09-2.033a.228.228 0 0 0-.297 0 .205.205 0 0 0-.083.286l1.074 2.015C2.441 7.436 1.066 9.6 1 12h14c-.036-2.431-1.415-4.635-3.566-5.695"
                ></path>
            </svg>
            {alt ? <span className="sr-only">{alt}</span> : null}
        </>
    );
};
