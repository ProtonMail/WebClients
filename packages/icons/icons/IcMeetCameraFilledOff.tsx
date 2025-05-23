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

export const IcMeetCameraFilledOff = ({
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
                    d="M9.99994 12.0002H8.24194L6.24194 14.0002H9.99994C10.5304 14.0002 11.0391 13.7895 11.4142 13.4144C11.7892 13.0393 11.9999 12.5306 11.9999 12.0002V9.60019L15.9999 12.0002V4.24219L9.99994 10.2422V12.0002Z"
                    stroke="currentColor"
                    fill="none"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                ></path>
                <path
                    d="M15.707 0.292786C15.5194 0.105315 15.2651 0 15 0C14.7348 0 14.4805 0.105315 14.293 0.292786L11.674 2.91179C11.4929 2.63247 11.2449 2.40277 10.9526 2.24351C10.6603 2.08425 10.3328 2.00048 9.99996 1.99979H1.99996C1.46953 1.99979 0.960818 2.2105 0.585746 2.58557C0.210673 2.96065 -4.08925e-05 3.46935 -4.08925e-05 3.99979V11.9998C0.000653714 12.3327 0.0844269 12.6601 0.243683 12.9524C0.402938 13.2448 0.63264 13.4927 0.911959 13.6738L0.292959 14.2928C0.197449 14.385 0.121267 14.4954 0.0688577 14.6174C0.0164487 14.7394 -0.0111375 14.8706 -0.0122913 15.0034C-0.0134452 15.1362 0.0118565 15.2678 0.0621374 15.3907C0.112418 15.5136 0.186671 15.6253 0.280564 15.7192C0.374457 15.8131 0.486109 15.8873 0.609005 15.9376C0.731901 15.9879 0.863581 16.0132 0.99636 16.012C1.12914 16.0109 1.26036 15.9833 1.38236 15.9309C1.50437 15.8785 1.61471 15.8023 1.70696 15.7068L15.707 1.70679C15.8944 1.51926 15.9997 1.26495 15.9997 0.999786C15.9997 0.734622 15.8944 0.480314 15.707 0.292786ZM1.99996 11.9998V3.99979H9.99996V4.58579L2.58596 11.9998H1.99996Z"
                    stroke="currentColor"
                    fill="none"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                ></path>
            </svg>
            {alt ? <span className="sr-only">{alt}</span> : null}
        </>
    );
};
