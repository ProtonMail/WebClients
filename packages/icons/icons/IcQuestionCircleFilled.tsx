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

export const IcQuestionCircleFilled = ({
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
                    d="M8.5 16a7.5 7.5 0 1 0 0-15 7.5 7.5 0 0 0 0 15Zm0-10.852a1.5 1.5 0 0 0-1.5 1.5.5.5 0 0 1-1 0 2.5 2.5 0 0 1 2.5-2.5h.148A2.352 2.352 0 0 1 11 6.5c0 .566-.266 1.098-.719 1.437l-.681.511a1.5 1.5 0 0 0-.6 1.2.5.5 0 0 1-1 0 2.5 2.5 0 0 1 1-2l.681-.51C9.882 6.986 10 6.75 10 6.5c0-.746-.605-1.352-1.352-1.352H8.5Zm0 7.602a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5Z"
                ></path>
            </svg>
            {alt ? <span className="sr-only">{alt}</span> : null}
        </>
    );
};
