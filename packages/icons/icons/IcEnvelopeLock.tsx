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

export const IcEnvelopeLock = ({ alt, title, size = 4, className = '', viewBox = '0 0 16 16', ...rest }: IconProps) => {
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
                    d="M2.9 1h-.02c-.403 0-.735 0-1.006.022-.281.023-.54.072-.782.196a2 2 0 0 0-.874.874c-.124.243-.173.501-.196.782C0 3.144 0 3.477 0 3.88V9.12c0 .403 0 .735.022 1.006.023.281.072.54.196.782a2 2 0 0 0 .874.874c.243.124.501.173.782.196.27.022.603.022 1.005.022H8v-1H2.9c-.428 0-.72 0-.944-.019-.22-.018-.332-.05-.41-.09a1 1 0 0 1-.437-.437l-.446.227.446-.227c-.04-.078-.072-.19-.09-.41A12.925 12.925 0 0 1 1 9.1V4.372L6.219 7.43a1.5 1.5 0 0 0 1.562 0L13 4.372V6.5h1V3.88c0-.403 0-.735-.022-1.006-.023-.281-.072-.54-.196-.782a2 2 0 0 0-.874-.874c-.243-.124-.501-.173-.782-.196A13.35 13.35 0 0 0 11.12 1H2.9Zm10.095 2.217a4.978 4.978 0 0 0-.014-.261c-.018-.22-.05-.332-.09-.41a1 1 0 0 0-.437-.437c-.078-.04-.19-.072-.41-.09A12.925 12.925 0 0 0 11.1 2H2.9c-.428 0-.72 0-.944.019-.22.018-.332.05-.41.09a1 1 0 0 0-.437.437c-.04.078-.072.19-.09.41a4.99 4.99 0 0 0-.014.26L6.73 6.57l.009.005a.5.5 0 0 0 .524 0l.01-.006 5.723-3.351Z"
                ></path>
                <path d="M9 11.8a.8.8 0 0 1 .8-.8h5.4a.8.8 0 0 1 .8.8v3.4a.8.8 0 0 1-.8.8H9.8a.8.8 0 0 1-.8-.8v-3.4Z"></path>
                <path d="M11 12v-2h-1v2h1Zm3-2v2h1v-2h-1Zm-1.5-1.5A1.5 1.5 0 0 1 14 10h1a2.5 2.5 0 0 0-2.5-2.5v1ZM11 10a1.5 1.5 0 0 1 1.5-1.5v-1A2.5 2.5 0 0 0 10 10h1Z"></path>
            </svg>
            {alt ? <span className="sr-only">{alt}</span> : null}
        </>
    );
};
