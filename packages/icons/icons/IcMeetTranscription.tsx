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

export const IcMeetTranscription = ({
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

                <path d="M12.0586 0.977539C13.6955 0.977539 15.0225 2.30451 15.0225 3.94141V12.0586C15.0225 13.6955 13.6955 15.0225 12.0586 15.0225H3.94141C2.30451 15.0225 0.977539 13.6955 0.977539 12.0586V3.94141C0.977542 2.30451 2.30451 0.977542 3.94141 0.977539H12.0586ZM3.94141 2.47754C3.13294 2.47754 2.47754 3.13294 2.47754 3.94141V12.0586C2.47754 12.8671 3.13293 13.5225 3.94141 13.5225H12.0586C12.8671 13.5225 13.5225 12.8671 13.5225 12.0586V3.94141C13.5225 3.13293 12.8671 2.47754 12.0586 2.47754H3.94141ZM8.7373 10.2021C9.15152 10.2021 9.4873 10.5379 9.4873 10.9521C9.48713 11.3662 9.15141 11.7021 8.7373 11.7021H4.67871C4.2646 11.7021 3.92888 11.3662 3.92871 10.9521C3.92871 10.5379 4.2645 10.2021 4.67871 10.2021H8.7373ZM11.3203 7.61914C11.7345 7.61914 12.0703 7.95493 12.0703 8.36914C12.0702 8.78328 11.7345 9.11914 11.3203 9.11914H4.67871C4.26455 9.11914 3.9288 8.78328 3.92871 8.36914C3.92871 7.95493 4.2645 7.61914 4.67871 7.61914H11.3203ZM11.3203 5.03613C11.7345 5.03613 12.0703 5.37192 12.0703 5.78613C12.0703 6.20035 11.7345 6.53613 11.3203 6.53613H4.67871C4.2645 6.53613 3.92871 6.20035 3.92871 5.78613C3.92871 5.37192 4.2645 5.03613 4.67871 5.03613H11.3203Z"></path>
            </svg>
            {alt ? <span className="sr-only">{alt}</span> : null}
        </>
    );
};
