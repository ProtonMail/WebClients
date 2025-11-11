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

export const IcMeetParticipants = ({
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
                    d="M6.83301 6.83301C6.83301 6.09663 6.23638 5.5 5.5 5.5C4.76362 5.5 4.16699 6.09663 4.16699 6.83301C4.16699 7.56939 4.76362 8.16602 5.5 8.16602C6.23638 8.16602 6.83301 7.56939 6.83301 6.83301ZM8.16699 6.83301C8.16699 8.30577 6.97276 9.5 5.5 9.5C4.02724 9.5 2.83301 8.30577 2.83301 6.83301C2.83301 5.36025 4.02724 4.16602 5.5 4.16602C6.97276 4.16602 8.16699 5.36025 8.16699 6.83301Z"
                    fill="currentColor"
                ></path>
                <path
                    d="M5.50024 10.166C8.44562 10.1662 10.8333 12.5546 10.8333 15.5C10.8331 15.868 10.5343 16.166 10.1663 16.166H0.833252C0.465171 16.166 0.166435 15.868 0.16626 15.5C0.16626 12.5545 2.55472 10.166 5.50024 10.166ZM5.50024 11.5C3.51834 11.5 1.87438 12.9413 1.55688 14.833H9.44263C9.12513 12.9415 7.48199 11.5002 5.50024 11.5Z"
                    fill="currentColor"
                ></path>
                <path
                    d="M12.1663 2.83301C12.1663 2.09663 11.5696 1.5 10.8333 1.5C10.0969 1.5 9.50024 2.09663 9.50024 2.83301C9.50024 3.56939 10.0969 4.16602 10.8333 4.16602C11.5696 4.16602 12.1663 3.56939 12.1663 2.83301ZM13.5002 2.83301C13.5002 4.30577 12.306 5.5 10.8333 5.5C9.36049 5.5 8.16626 4.30577 8.16626 2.83301C8.16626 1.36025 9.36049 0.166016 10.8333 0.166016C12.306 0.166016 13.5002 1.36025 13.5002 2.83301Z"
                    fill="currentColor"
                ></path>
                <path
                    d="M10.8338 6.16602C13.7791 6.16619 16.1668 8.55459 16.1668 11.5C16.1666 11.868 15.8679 12.166 15.4998 12.166H11.4998C11.1318 12.1658 10.8339 11.8679 10.8338 11.5C10.8338 11.1319 11.1317 10.8332 11.4998 10.833H14.7761C14.4586 8.94146 12.8155 7.50016 10.8338 7.5C10.6386 7.5 10.4479 7.51325 10.2615 7.54004C9.8972 7.59235 9.55916 7.33981 9.50661 6.97559C9.45423 6.61114 9.7076 6.27309 10.072 6.2207C10.3216 6.18483 10.5756 6.16602 10.8338 6.16602Z"
                    fill="currentColor"
                ></path>
            </svg>
            {alt ? <span className="sr-only">{alt}</span> : null}
        </>
    );
};
