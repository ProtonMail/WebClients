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

export const IcDrawerDividers = ({
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

                <path d="M13.935 7a1 1 0 0 1 .999 1.063l-.375 6-.011.097a1 1 0 0 1-.988.84H2.44l-.098-.005a1 1 0 0 1-.89-.835l-.01-.098-.376-6a1 1 0 0 1 .892-1.056L2.064 7h11.872ZM2.44 14h11.12l.375-6H2.066l.374 6Zm11.189-8.993A1.25 1.25 0 0 1 14.75 6.25a.5.5 0 0 1-1 0 .25.25 0 0 0-.2-.245L13.5 6h-11a.25.25 0 0 0-.25.25.5.5 0 0 1-1 0C1.25 5.56 1.81 5 2.5 5h11l.128.007ZM13.25 3c.69 0 1.25.56 1.25 1.25a.5.5 0 0 1-1 0 .25.25 0 0 0-.25-.25H2.75a.25.25 0 0 0-.25.25.5.5 0 0 1-1 0C1.5 3.56 2.06 3 2.75 3h10.5ZM13 1c.69 0 1.25.56 1.25 1.25a.5.5 0 0 1-1 0A.25.25 0 0 0 13 2H3a.25.25 0 0 0-.25.25.5.5 0 0 1-1 0C1.75 1.56 2.31 1 3 1h10Z"></path>
            </svg>
            {alt ? <span className="sr-only">{alt}</span> : null}
        </>
    );
};
