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

export const IcEnvelopeCheck = ({
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
                    d="M3.88 2c-.403 0-.735 0-1.006.022-.281.023-.54.072-.782.196a2 2 0 0 0-.874.874c-.124.243-.173.501-.196.782C1 4.144 1 4.477 1 4.88v5.242c0 .402 0 .734.022 1.005.023.281.072.54.196.782a2 2 0 0 0 .874.874c.243.124.501.173.782.196.27.022.603.022 1.005.022H9.5a.5.5 0 0 0 0-1H3.9c-.428 0-.72 0-.944-.019-.22-.018-.332-.05-.41-.09a1 1 0 0 1-.437-.437c-.04-.078-.072-.19-.09-.41A12.925 12.925 0 0 1 2 10.1V5.372L7.219 8.43a1.5 1.5 0 0 0 1.562 0L14 5.372V8.5a.5.5 0 0 0 1 0V4.88c0-.403 0-.735-.022-1.006-.023-.281-.072-.54-.196-.782a2 2 0 0 0-.874-.874c-.243-.124-.501-.173-.782-.196C12.856 2 12.523 2 12.12 2H3.879ZM2.004 4.217a4.99 4.99 0 0 1 .014-.261c.018-.22.05-.332.09-.41a1 1 0 0 1 .437-.437c.078-.04.19-.072.41-.09C3.18 3 3.472 3 3.9 3h8.2c.428 0 .72 0 .944.019.22.018.332.05.41.09a1 1 0 0 1 .437.437c.04.078.072.19.09.41.007.078.01.164.014.26L8.27 7.569l-.009.006a.5.5 0 0 1-.524 0L2.005 4.217Z"
                ></path>
                <path d="M15.85 10.354a.5.5 0 1 0-.707-.708l-2.432 2.433a4.109 4.109 0 0 1-.207.2l-.005.004-.006-.004a4.065 4.065 0 0 1-.207-.2l-.932-.933a.5.5 0 0 0-.707.707l.944.945c.089.089.176.176.255.243.088.075.199.154.344.201a1 1 0 0 0 .617 0c.145-.047.256-.127.344-.2.08-.068.166-.155.255-.244l2.444-2.444Z"></path>
            </svg>
            {alt ? <span className="sr-only">{alt}</span> : null}
        </>
    );
};
