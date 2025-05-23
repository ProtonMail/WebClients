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

export const IcMeetMicrophoneFilledOff = ({
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
                    d="M15.1 6.00009C14.9749 5.97688 14.8463 5.9794 14.7222 6.00751C14.598 6.03562 14.4809 6.08873 14.378 6.16359C14.2751 6.23845 14.1885 6.33349 14.1235 6.44293C14.0585 6.55236 14.0165 6.67388 14 6.80009C13.8011 8.08527 13.1986 9.27389 12.2797 10.1941C11.3607 11.1143 10.1729 11.7184 8.888 11.9191L7 14.5621V16.0001H9V13.9001C10.7383 13.6843 12.3567 12.9009 13.6043 11.6714C14.8519 10.4419 15.6588 8.83501 15.9 7.10009C15.9322 6.84928 15.8672 6.59567 15.7185 6.39118C15.5698 6.18668 15.3485 6.04677 15.1 6.00009Z"
                    stroke="currentColor"
                    fill="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                ></path>
                <path
                    d="M6.51997 11.7931C5.38026 11.5093 4.35101 10.8923 3.56371 10.0207C2.77641 9.14914 2.26679 8.06267 2.09997 6.90008C2.0839 6.76062 2.03957 6.62591 1.96969 6.50416C1.89982 6.38241 1.80586 6.27618 1.69356 6.19195C1.58126 6.10773 1.45297 6.04727 1.31653 6.01428C1.18008 5.98129 1.03834 5.97646 0.899969 6.00008C0.651457 6.04676 0.430189 6.18667 0.281465 6.39116C0.13274 6.59566 0.0678109 6.84927 0.0999692 7.10008C0.311278 8.53524 0.910035 9.88559 1.83178 11.0057C2.75352 12.1259 3.96333 12.9734 5.33097 13.4571L6.51997 11.7931Z"
                    stroke="currentColor"
                    fill="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                ></path>
                <path
                    d="M7.814 9.981L12 4.121V4C12 2.93913 11.5786 1.92172 10.8284 1.17157C10.0783 0.421427 9.06087 0 8 0C6.93913 0 5.92172 0.421427 5.17157 1.17157C4.42143 1.92172 4 2.93913 4 4V6C4.00376 7.02613 4.40173 8.01156 5.11161 8.75252C5.82149 9.49348 6.78898 9.93329 7.814 9.981Z"
                    fill="white"
                ></path>
                <path
                    d="M2.99995 16.0001C2.81632 15.9999 2.63627 15.9492 2.47956 15.8535C2.32285 15.7577 2.19553 15.6207 2.11155 15.4574C2.02757 15.2941 1.99018 15.1108 2.00348 14.9277C2.01678 14.7445 2.08026 14.5685 2.18695 14.4191L12.187 0.419083C12.341 0.203197 12.5746 0.0573648 12.8362 0.0136688C13.0978 -0.0300272 13.3661 0.031992 13.582 0.186083C13.7978 0.340174 13.9437 0.573714 13.9874 0.835327C14.0311 1.09694 13.969 1.3652 13.815 1.58108L3.81495 15.5811C3.72234 15.7108 3.60004 15.8165 3.45827 15.8894C3.3165 15.9623 3.15936 16.0003 2.99995 16.0001Z"
                    stroke="currentColor"
                    fill="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                ></path>
            </svg>
            {alt ? <span className="sr-only">{alt}</span> : null}
        </>
    );
};
