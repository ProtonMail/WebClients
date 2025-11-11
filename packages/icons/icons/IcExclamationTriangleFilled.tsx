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

export const IcExclamationTriangleFilled = ({
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
                    d="M14.9 14H1.1c-.843 0-1.372-.894-.954-1.613L7.046.543c.422-.724 1.486-.724 1.908 0l6.9 11.844c.418.719-.11 1.613-.955 1.613ZM8 3.757c.622 0 1.104.535 1.027 1.14l-.482 3.779A.546.546 0 0 1 8 9.148a.546.546 0 0 1-.545-.472l-.482-3.778A1.022 1.022 0 0 1 8 3.757Zm.77 7.008a.762.762 0 0 1-.77.755.762.762 0 0 1-.77-.755c0-.417.345-.755.77-.755.425 0 .77.338.77.755Z"
                ></path>
            </svg>
            {alt ? <span className="sr-only">{alt}</span> : null}
        </>
    );
};
