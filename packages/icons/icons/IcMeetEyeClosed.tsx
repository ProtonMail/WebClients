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

export const IcMeetEyeClosed = ({
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

                <path d="M15.6097 6L15.138 6.47168C14.6743 6.9354 14.2054 7.35387 13.7347 7.72949L15.0745 9.44922L14.0228 10.2686L12.6526 8.50879C11.9487 8.96217 11.2376 9.31418 10.5189 9.5625L10.9163 10.9863L11.096 11.6279L9.81183 11.9863L9.22687 9.89355C8.82004 9.96166 8.41161 9.99998 8.00031 10C7.58805 10 7.17859 9.96195 6.77081 9.89355L6.36749 11.3447L6.18781 11.9863L4.90363 11.6279L5.4798 9.56152C4.76143 9.31322 4.05053 8.96188 3.34698 8.50879L1.97784 10.2686L0.926086 9.44922L2.26398 7.72949C1.79339 7.354 1.32516 6.93521 0.861633 6.47168L0.39093 6L1.33331 5.05762L1.80499 5.52832C2.23429 5.95762 2.6609 6.33965 3.08331 6.67773L3.0882 6.67285L3.55499 7.03613C5.08111 8.14391 6.56096 8.66699 8.00031 8.66699C9.43936 8.66691 10.9188 8.14353 12.4446 7.03613L12.9124 6.67285L12.9163 6.67773C13.3389 6.33954 13.7661 5.95781 14.1956 5.52832L14.6663 5.05762L15.6097 6Z"></path>
            </svg>
            {alt ? <span className="sr-only">{alt}</span> : null}
        </>
    );
};
