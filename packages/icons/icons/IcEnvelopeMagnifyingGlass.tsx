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

export const IcEnvelopeMagnifyingGlass = ({
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
                    d="M2.9 2h-.02c-.403 0-.735 0-1.006.022-.281.023-.54.072-.782.196a2 2 0 0 0-.874.874c-.124.243-.173.501-.196.782C0 4.144 0 4.477 0 4.88v5.241c0 .403 0 .735.022 1.006.023.281.072.54.196.782a2 2 0 0 0 .874.874c.243.124.501.173.782.196.27.022.603.022 1.005.022H8v-1H2.9c-.428 0-.72 0-.944-.019-.22-.018-.332-.05-.41-.09a1 1 0 0 1-.437-.437c-.04-.078-.072-.19-.09-.41A12.925 12.925 0 0 1 1 10.1V5.372L6.219 8.43a1.5 1.5 0 0 0 1.562 0L13 5.372V8h1V4.88c0-.403 0-.735-.022-1.006-.023-.281-.072-.54-.196-.782a2 2 0 0 0-.874-.874c-.243-.124-.501-.173-.782-.196C11.856 2 11.523 2 11.12 2H2.9Zm10.095 2.217a4.978 4.978 0 0 0-.014-.261c-.018-.22-.05-.332-.09-.41a1 1 0 0 0-.437-.437c-.078-.04-.19-.072-.41-.09A12.925 12.925 0 0 0 11.1 3H2.9c-.428 0-.72 0-.944.019-.22.018-.332.05-.41.09a1 1 0 0 0-.437.437c-.04.078-.072.19-.09.41a4.99 4.99 0 0 0-.014.26L6.73 7.57l.009.005a.5.5 0 0 0 .524 0l.01-.006 5.723-3.351ZM12 14a2 2 0 1 0 0-4 2 2 0 0 0 0 4Zm2.445-.262a3 3 0 1 0-.707.707l1.409 1.408a.5.5 0 1 0 .707-.707l-1.409-1.408Z"
                ></path>
            </svg>
            {alt ? <span className="sr-only">{alt}</span> : null}
        </>
    );
};
