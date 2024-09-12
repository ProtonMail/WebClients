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

export const IcLockOpenPenFilled = ({
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
                    d="M8.239 2.935A2.358 2.358 0 0 0 4 4.358V5h4.8c1.12 0 1.68 0 2.108.218a2 2 0 0 1 .691.58l-3.7 3.685a2.114 2.114 0 0 0-.583 1.09l-.273 1.187-.004.021a1.28 1.28 0 0 0 1.517 1.485l.018-.004 1.178-.288c.396-.085.76-.283 1.049-.57L12 11.21v.59c0 1.12 0 1.68-.218 2.108a2 2 0 0 1-.874.874C10.48 15 9.92 15 8.8 15H4.2c-1.12 0-1.68 0-2.108-.218a2 2 0 0 1-.874-.874C1 13.48 1 12.92 1 11.8V8.2c0-1.12 0-1.68.218-2.108a2 2 0 0 1 .874-.874c.238-.121.516-.175.908-.199v-.66A3.358 3.358 0 0 1 9.036 2.33l.363.48a.5.5 0 1 1-.798.603l-.362-.479Zm5.088 2.524c.22-.219.576-.219.796 0l.712.71a.56.56 0 0 1 0 .794l-4.746 4.732A1.127 1.127 0 0 1 9.52 12l-1.181.289a.281.281 0 0 1-.334-.325l.274-1.192c.041-.224.15-.43.311-.591l4.737-4.722Z"
                ></path>
            </svg>
            {alt ? <span className="sr-only">{alt}</span> : null}
        </>
    );
};
