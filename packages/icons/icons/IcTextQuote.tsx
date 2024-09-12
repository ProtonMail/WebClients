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

export const IcTextQuote = ({ alt, title, size = 4, className = '', viewBox = '0 0 16 16', ...rest }: IconProps) => {
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
                    d="M3 2.5a.5.5 0 0 0-1 0v11a.5.5 0 0 0 1 0v-11Zm1.5 3.833c0-1.066.952-1.833 2-1.833s2 .767 2 1.833V7c0 .098-.008.193-.023.285-.131 1.384-.807 2.678-1.902 3.65l-.493.439a.5.5 0 1 1-.664-.748l.492-.438c.469-.416.841-.897 1.107-1.418-.167.042-.34.063-.517.063-1.048 0-2-.767-2-1.833v-.667Zm3 .458c0 .115-.005.23-.014.343-.074.361-.444.7-.986.7-.61 0-1-.427-1-.834v-.667c0-.406.39-.833 1-.833s1 .427 1 .833v.458Zm2-.458c0-1.066.952-1.833 2-1.833s2 .767 2 1.833V7c0 .098-.008.193-.023.285-.131 1.384-.807 2.678-1.902 3.65l-.493.439a.5.5 0 1 1-.664-.748l.493-.438c.468-.416.84-.897 1.106-1.418-.167.042-.34.063-.517.063-1.048 0-2-.767-2-1.833v-.667Zm3 .458c0 .115-.005.23-.014.343-.075.361-.444.7-.986.7-.61 0-1-.427-1-.834v-.667c0-.406.39-.833 1-.833s1 .427 1 .833v.458Z"
                ></path>
            </svg>
            {alt ? <span className="sr-only">{alt}</span> : null}
        </>
    );
};
