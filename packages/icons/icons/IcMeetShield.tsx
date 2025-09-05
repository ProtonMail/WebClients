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

export const IcMeetShield = ({ alt, title, size = 4, className = '', viewBox = '0 0 16 16', ...rest }: IconProps) => {
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

                <path d="M13.9992 3.73454C12.0607 3.51851 10.2448 2.67873 8.82482 1.3416C8.60603 1.12287 8.30932 1 7.99995 1C7.69058 1 7.39387 1.12287 7.17508 1.3416C5.75505 2.67873 3.93917 3.51851 2.00068 3.73454C1.72297 3.77438 1.46891 3.91296 1.28506 4.12488C1.10121 4.3368 0.999877 4.60787 0.999634 4.88843C0.999634 5.19061 1.0743 12.3204 7.56593 14.9222C7.84474 15.0327 8.15516 15.0327 8.43397 14.9222C14.9256 12.3169 15.0003 5.19061 15.0003 4.88843C15 4.60787 14.8987 4.3368 14.7148 4.12488C14.531 3.91296 14.2769 3.77438 13.9992 3.73454ZM7.99995 12.5631C6.7343 11.9167 5.65118 10.9629 4.84987 9.78913C4.04856 8.61539 3.5547 7.25929 3.41358 5.84514C5.08114 5.48623 6.64786 4.76047 7.99995 3.72054C9.35074 4.75877 10.9153 5.48404 12.5805 5.84397C12.4342 7.25598 11.9389 8.60941 11.1393 9.78236C10.3397 10.9553 9.26083 11.9109 7.99995 12.5631Z"></path>
            </svg>
            {alt ? <span className="sr-only">{alt}</span> : null}
        </>
    );
};
