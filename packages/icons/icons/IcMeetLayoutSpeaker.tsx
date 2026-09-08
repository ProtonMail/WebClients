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

export const IcMeetLayoutSpeaker = ({
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
                    d="M6.72 13.36C6.72 12.609 6.111 12 5.36 12H2.64C1.889 12 1.28 12.609 1.28 13.36M6.72 13.36C6.72 14.111 6.111 14.72 5.36 14.72H2.64C1.889 14.72 1.28 14.111 1.28 13.36M14.72 13.36C14.72 12.609 14.111 12 13.36 12H10.64C9.889 12 9.28 12.609 9.28 13.36M14.72 13.36C14.72 14.111 14.111 14.72 13.36 14.72H10.64C9.889 14.72 9.28 14.111 9.28 13.36M2.64 1.28H13.36C14.111 1.28 14.72 1.889 14.72 2.64V8.08C14.72 8.831 14.111 9.44 13.36 9.44H2.64C1.889 9.44 1.28 8.831 1.28 8.08V2.64C1.28 1.889 1.889 1.28 2.64 1.28Z"
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
