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

export const IcPencil = ({ alt, title, size = 4, className = '', viewBox = '0 0 16 16', ...rest }: IconProps) => {
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
                    d="m10.837 3.63 1.52 1.52 1.133-1.127a.032.032 0 0 0 0-.047l-1.47-1.464a.037.037 0 0 0-.013-.009.046.046 0 0 0-.017-.003.046.046 0 0 0-.017.003.037.037 0 0 0-.013.009L10.837 3.63Zm-.708.706L3.21 11.225c-.154.153-.258.35-.297.563l-.291 1.578 1.555-.32c.207-.042.397-.144.546-.292l6.926-6.898-1.52-1.52Zm2.596-2.533a1.043 1.043 0 0 0-1.47 0l-8.75 8.713a2.067 2.067 0 0 0-.575 1.09l-.421 2.283a.519.519 0 0 0 .616.6l2.253-.463a2.082 2.082 0 0 0 1.05-.564l8.767-8.73a1.032 1.032 0 0 0 0-1.464l-1.47-1.465Z"
                ></path>
            </svg>
            {alt ? <span className="sr-only">{alt}</span> : null}
        </>
    );
};
