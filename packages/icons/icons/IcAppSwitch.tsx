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

export const IcAppSwitch = ({ alt, title, size = 4, className = '', viewBox = '0 0 16 16', ...rest }: IconProps) => {
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
                    d="M5.333 2.667H4c-.736 0-1.333.597-1.333 1.333v1.333c0 .737.597 1.334 1.333 1.334h1.333c.737 0 1.334-.597 1.334-1.334V4c0-.736-.597-1.333-1.334-1.333ZM4 2a2 2 0 0 0-2 2v1.333a2 2 0 0 0 2 2h1.333a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2H4Zm8 .667h-1.333c-.737 0-1.334.597-1.334 1.333v1.333c0 .737.597 1.334 1.334 1.334H12c.736 0 1.333-.597 1.333-1.334V4c0-.736-.597-1.333-1.333-1.333ZM10.667 2a2 2 0 0 0-2 2v1.333a2 2 0 0 0 2 2H12a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2h-1.333ZM12 9.333h-1.333c-.737 0-1.334.597-1.334 1.334V12c0 .736.597 1.333 1.334 1.333H12c.736 0 1.333-.597 1.333-1.333v-1.333c0-.737-.597-1.334-1.333-1.334Zm-1.333-.666a2 2 0 0 0-2 2V12a2 2 0 0 0 2 2H12a2 2 0 0 0 2-2v-1.333a2 2 0 0 0-2-2h-1.333Zm-5.334.666H4c-.736 0-1.333.597-1.333 1.334V12c0 .736.597 1.333 1.333 1.333h1.333c.737 0 1.334-.597 1.334-1.333v-1.333c0-.737-.597-1.334-1.334-1.334ZM4 8.667a2 2 0 0 0-2 2V12a2 2 0 0 0 2 2h1.333a2 2 0 0 0 2-2v-1.333a2 2 0 0 0-2-2H4Z"
                    clipRule="evenodd"
                ></path>
            </svg>
            {alt ? <span className="sr-only">{alt}</span> : null}
        </>
    );
};
