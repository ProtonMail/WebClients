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

export const IcKey = ({ alt, title, size = 4, className = '', viewBox = '0 0 16 16', ...rest }: IconProps) => {
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
                    d="M7.348 3.146a3.893 3.893 0 1 1 1.51 6.443l-.296-.1-.22.22-.521.522H6.647a.503.503 0 0 0-.503.503v.879h-.878a.503.503 0 0 0-.503.503v.878H3.006v-2.052L6.29 7.658l.22-.22-.099-.296a3.893 3.893 0 0 1 .938-3.996Zm6.217-.711a4.899 4.899 0 0 0-8.199 4.724L2.29 10.235a.991.991 0 0 0-.29.701v2.561a.503.503 0 0 0 .503.503h2.275a.991.991 0 0 0 .991-.991v-.39h.878a.503.503 0 0 0 .503-.503v-.879h.879a.503.503 0 0 0 .356-.147l.456-.457a4.899 4.899 0 0 0 4.724-8.199ZM11.11 5.903a1.012 1.012 0 1 0 0-2.025 1.012 1.012 0 0 0 0 2.025Z"
                ></path>
            </svg>
            {alt ? <span className="sr-only">{alt}</span> : null}
        </>
    );
};
