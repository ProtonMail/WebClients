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

export const IcMeetSpeakerIndicator = ({
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

                <path d="M2 7C2 7.26522 1.89464 7.51957 1.70711 7.70711C1.51957 7.89464 1.26522 8 1 8C0.734784 8 0.48043 7.89464 0.292893 7.70711C0.105357 7.51957 0 7.26522 0 7V3C0 2.73478 0.105357 2.48043 0.292893 2.29289C0.48043 2.10536 0.734784 2 1 2C1.26522 2 1.51957 2.10536 1.70711 2.29289C1.89464 2.48043 2 2.73478 2 3V7ZM6 9C6 9.26522 5.89464 9.51957 5.70711 9.70711C5.51957 9.89464 5.26522 10 5 10C4.73478 10 4.48043 9.89464 4.29289 9.70711C4.10536 9.51957 4 9.26522 4 9V1C4 0.734784 4.10536 0.48043 4.29289 0.292893C4.48043 0.105357 4.73478 0 5 0C5.26522 0 5.51957 0.105357 5.70711 0.292893C5.89464 0.48043 6 0.734784 6 1V9ZM10 6C10 6.26522 9.89464 6.51957 9.70711 6.70711C9.51957 6.89464 9.26522 7 9 7C8.73478 7 8.48043 6.89464 8.29289 6.70711C8.10536 6.51957 8 6.26522 8 6V4C8 3.73478 8.10536 3.48043 8.29289 3.29289C8.48043 3.10536 8.73478 3 9 3C9.26522 3 9.51957 3.10536 9.70711 3.29289C9.89464 3.48043 10 3.73478 10 4V6ZM14 8C14 8.26522 13.8946 8.51957 13.7071 8.70711C13.5196 8.89464 13.2652 9 13 9C12.7348 9 12.4804 8.89464 12.2929 8.70711C12.1054 8.51957 12 8.26522 12 8V2C12 1.73478 12.1054 1.48043 12.2929 1.29289C12.4804 1.10536 12.7348 1 13 1C13.2652 1 13.5196 1.10536 13.7071 1.29289C13.8946 1.48043 14 1.73478 14 2V8Z"></path>
            </svg>
            {alt ? <span className="sr-only">{alt}</span> : null}
        </>
    );
};
