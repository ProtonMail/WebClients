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

export const IcPassShieldFillSuccess = ({
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
                    d="M7.14564 1.27864C7.69754 1.07796 8.30246 1.07796 8.85436 1.27864L13.6709 3.0301C13.8685 3.10196 14 3.28975 14 3.5V9.12547C14 10.7722 13.1005 12.2875 11.6548 13.076L8.23943 14.939C8.09019 15.0204 7.90981 15.0204 7.76057 14.939L4.34517 13.076C2.89949 12.2875 2 10.7722 2 9.12547V3.5C2 3.28975 2.13153 3.10196 2.32913 3.0301L7.14564 1.27864ZM10.8536 6.35278C11.0488 6.15751 11.0488 5.84093 10.8536 5.64567C10.6583 5.45041 10.3417 5.45041 10.1464 5.64567L7 8.79212L5.85355 7.64567C5.65829 7.45041 5.34171 7.45041 5.14645 7.64567C4.95118 7.84093 4.95118 8.15751 5.14645 8.35278L6.64645 9.85278C6.84171 10.048 7.15829 10.048 7.35355 9.85278L10.8536 6.35278Z"
                ></path>
            </svg>
            {alt ? <span className="sr-only">{alt}</span> : null}
        </>
    );
};
