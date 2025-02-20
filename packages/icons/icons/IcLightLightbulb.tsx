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

export const IcLightLightbulb = ({
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
                    d="M.5 6.5A.5.5 0 0 1 1 6h1a.5.5 0 0 1 0 1H1a.5.5 0 0 1-.5-.5Zm13 0A.5.5 0 0 1 14 6h1a.5.5 0 0 1 0 1h-1a.5.5 0 0 1-.5-.5Zm.104-5.104a.5.5 0 0 1 0 .708l-.75.75a.5.5 0 0 1-.708-.708l.75-.75a.5.5 0 0 1 .708 0Z"
                ></path>
                <path
                    fillRule="evenodd"
                    d="M8 3a4 4 0 0 0-1.907 7.517c.493.268.907.785.907 1.434V12h2v-.049c0-.649.414-1.166.907-1.434A4 4 0 0 0 8 3Zm1 10H7v.5a.5.5 0 0 0 .5.5h1a.5.5 0 0 0 .5-.5V13ZM3 7a5 5 0 1 1 7.384 4.396c-.252.137-.384.356-.384.555V13.5A1.5 1.5 0 0 1 8.5 15h-1A1.5 1.5 0 0 1 6 13.5v-1.549c0-.199-.132-.418-.384-.555A4.999 4.999 0 0 1 3 7Zm-.604-5.604a.5.5 0 0 1 .708 0l.75.75a.5.5 0 1 1-.708.708l-.75-.75a.5.5 0 0 1 0-.708Z"
                ></path>
            </svg>
            {alt ? <span className="sr-only">{alt}</span> : null}
        </>
    );
};
