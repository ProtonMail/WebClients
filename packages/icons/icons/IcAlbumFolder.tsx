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

export const IcAlbumFolder = ({ alt, title, size = 4, className = '', viewBox = '0 0 16 16', ...rest }: IconProps) => {
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
                    d="M14 12.7382V6.23816C14 5.68587 13.5523 5.23816 13 5.23816H8.56667C8.30702 5.23816 8.05438 5.15395 7.84667 4.99816L6.43333 3.93816C6.26024 3.80834 6.0497 3.73816 5.83333 3.73816H3C2.44772 3.73816 2 4.18587 2 4.73816V12.7382C2 13.2904 2.44772 13.7382 3 13.7382H13C13.5523 13.7382 14 13.2904 14 12.7382ZM3 2.73816C1.89543 2.73816 1 3.63359 1 4.73816V12.7382C1 13.8427 1.89543 14.7382 3 14.7382H13C14.1046 14.7382 15 13.8427 15 12.7382V6.23816C15 5.13359 14.1046 4.23816 13 4.23816H8.56667C8.52339 4.23816 8.48129 4.22412 8.44667 4.19816L7.03333 3.13816C6.68714 2.87851 6.26607 2.73816 5.83333 2.73816H3Z"
                ></path>
                <path d="M9.22659 12.7382C9.52758 12.7382 9.70171 12.416 9.52511 12.1859L7.45699 9.49109C7.36868 9.37603 7.18708 9.37603 7.09877 9.49109L5.59479 11.4508L4.75857 10.3612C4.67027 10.2461 4.48866 10.2461 4.40036 10.3612L3 12.1859C2.8234 12.416 2.99753 12.7382 3.29851 12.7382H9.22659Z"></path>
                <path d="M5.93052 8.73813C5.93052 9.10633 5.63204 9.4048 5.26385 9.4048C4.89567 9.4048 4.59719 9.10633 4.59719 8.73813C4.59719 8.36994 4.89567 8.07146 5.26385 8.07146C5.63204 8.07146 5.93052 8.36994 5.93052 8.73813Z"></path>
            </svg>
            {alt ? <span className="sr-only">{alt}</span> : null}
        </>
    );
};
