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

export const IcMeetLayoutGallery = ({
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
                    d="M5.36 1.28H2.64C1.889 1.28 1.28 1.889 1.28 2.64V5.36C1.28 6.111 1.889 6.72 2.64 6.72H5.36C6.111 6.72 6.72 6.111 6.72 5.36V2.64C6.72 1.889 6.111 1.28 5.36 1.28Z"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.28"
                    strokeLinecap="round"
                ></path>
                <path
                    d="M13.36 1.28H10.64C9.889 1.28 9.28 1.889 9.28 2.64V5.36C9.28 6.111 9.889 6.72 10.64 6.72H13.36C14.111 6.72 14.72 6.111 14.72 5.36V2.64C14.72 1.889 14.111 1.28 13.36 1.28Z"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.28"
                    strokeLinecap="round"
                ></path>
                <path
                    d="M5.36 9.28H2.64C1.889 9.28 1.28 9.889 1.28 10.64V13.36C1.28 14.111 1.889 14.72 2.64 14.72H5.36C6.111 14.72 6.72 14.111 6.72 13.36V10.64C6.72 9.889 6.111 9.28 5.36 9.28Z"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.28"
                    strokeLinecap="round"
                ></path>
                <path
                    d="M13.36 9.28H10.64C9.889 9.28 9.28 9.889 9.28 10.64V13.36C9.28 14.111 9.889 14.72 10.64 14.72H13.36C14.111 14.72 14.72 14.111 14.72 13.36V10.64C14.72 9.889 14.111 9.28 13.36 9.28Z"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.28"
                    strokeLinecap="round"
                ></path>
            </svg>
            {alt ? <span className="sr-only">{alt}</span> : null}
        </>
    );
};
