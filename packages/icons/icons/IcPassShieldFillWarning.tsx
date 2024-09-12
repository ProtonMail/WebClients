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

export const IcPassShieldFillWarning = ({
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
                    clipRule="evenodd"
                    d="M7.14564 1.27864C7.69754 1.07796 8.30246 1.07796 8.85436 1.27864L13.6709 3.0301C13.8685 3.10196 14 3.28975 14 3.5V9.12547C14 10.7722 13.1005 12.2875 11.6548 13.076L8.23943 14.939C8.09019 15.0204 7.90981 15.0204 7.76057 14.939L4.34517 13.076C2.89949 12.2875 2 10.7722 2 9.12547V3.5C2 3.28975 2.13153 3.10196 2.32913 3.0301L7.14564 1.27864ZM8 3.99995C7.72386 3.99995 7.5 4.22381 7.5 4.49995V9.49996C7.5 9.7761 7.72386 9.99996 8 9.99996V9.99996C8.27614 9.99996 8.5 9.7761 8.5 9.49996V4.49995C8.5 4.22381 8.27614 3.99995 8 3.99995V3.99995ZM8.5 11.5C8.5 11.2238 8.27614 11 8 11V11C7.72386 11 7.5 11.2238 7.5 11.5V11.5C7.5 11.7761 7.72386 12 8 12V12C8.27614 12 8.5 11.7761 8.5 11.5V11.5Z"
                ></path>
            </svg>
            {alt ? <span className="sr-only">{alt}</span> : null}
        </>
    );
};
