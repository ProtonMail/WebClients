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

export const IcCreditCardSlashed = ({
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
                    d="M2.147 1.743a.5.5 0 0 1 .707 0l1.257 1.256H13a2 2 0 0 1 2 2v6a2 2 0 0 1-1.103 1.788l.36.36a.5.5 0 0 1-.707.707L2.147 2.45a.5.5 0 0 1 0-.707ZM9.112 8l3.993 3.994a1 1 0 0 0 .896-.995V8h-4.89Zm-2-2h6.89V5a1 1 0 0 0-1-1H5.11l2 2Z"
                    clipRule="evenodd"
                ></path>
                <path d="M2.452 4.164a1 1 0 0 0-.45.835V6H4.29l2 2H2v3a1 1 0 0 0 1 1h7.287l1 1H3l-.204-.011a2 2 0 0 1-1.785-1.785l-.01-.205L1 6l.001-1c0-.626.287-1.184.737-1.55l.714.714Z"></path>
            </svg>
            {alt ? <span className="sr-only">{alt}</span> : null}
        </>
    );
};
