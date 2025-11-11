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

export const IcPanorama = ({ alt, title, size = 4, className = '', viewBox = '0 0 16 16', ...rest }: IconProps) => {
    return (
        <>
            {/* eslint-disable-next-line jsx-a11y/prefer-tag-over-role */}
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
                    d="M1.717 4.223ZM2 4.336C3.854 5.086 5.88 5.5 8 5.5s4.146-.413 6-1.164v7.326A15.957 15.957 0 0 0 8 10.5c-2.12 0-4.146.413-6 1.163V4.337Zm12.283 7.44h-.001ZM1.013 3.773c-.009.074-.013.15-.013.226v8c0 .077.004.153.013.228.058.509.645.665 1.116.465A14.953 14.953 0 0 1 8 11.499c2.083 0 4.068.425 5.87 1.193.472.2 1.06.044 1.117-.465.009-.075.013-.151.013-.228v-8c0-.077-.004-.152-.013-.226-.057-.51-.644-.667-1.116-.466A14.952 14.952 0 0 1 8 4.5c-2.083 0-4.068-.425-5.87-1.193-.473-.2-1.06-.044-1.117.466Z"
                ></path>
            </svg>
            {alt ? <span className="sr-only">{alt}</span> : null}
        </>
    );
};
