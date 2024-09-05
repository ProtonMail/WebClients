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

export const IcLockPenFilled = ({
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
                    d="M9 5v-.5a2.5 2.5 0 0 0-5 0V5h5Zm1 .02V4.5a3.5 3.5 0 1 0-7 0v.52c-.392.023-.67.077-.908.198a2 2 0 0 0-.874.874C1 6.52 1 7.08 1 8.2v3.6c0 1.12 0 1.68.218 2.108a2 2 0 0 0 .874.874C2.52 15 3.08 15 4.2 15h4.6c1.12 0 1.68 0 2.108-.218a2 2 0 0 0 .874-.874C12 13.48 12 12.92 12 11.8v-.59l-1.2 1.194a2.121 2.121 0 0 1-1.048.57l-1.178.288-.018.004a1.28 1.28 0 0 1-1.517-1.485l.004-.021.273-1.188c.082-.413.285-.792.583-1.089l3.7-3.684a2 2 0 0 0-.691-.581c-.237-.121-.516-.175-.908-.199Zm3.327.44c.22-.22.576-.22.796 0l.712.71a.56.56 0 0 1 0 .793l-4.746 4.732A1.127 1.127 0 0 1 9.52 12l-1.181.289a.281.281 0 0 1-.334-.325l.274-1.192c.041-.224.15-.43.311-.591l4.737-4.722Z"
                ></path>
            </svg>
            {alt ? <span className="sr-only">{alt}</span> : null}
        </>
    );
};
