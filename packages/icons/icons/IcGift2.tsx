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

export const IcGift2 = ({ alt, title, size = 4, className = '', viewBox = '0 0 16 16', ...rest }: IconProps) => {
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
                    d="M8 0.25C8.41421 0.25 8.75 0.585786 8.75 1V15C8.75 15.4142 8.41421 15.75 8 15.75C7.58579 15.75 7.25 15.4142 7.25 15V1C7.25 0.585786 7.58579 0.25 8 0.25Z"
                ></path>
                <path
                    fillRule="evenodd"
                    d="M15.75 8C15.75 8.41421 15.4142 8.75 15 8.75H1C0.585787 8.75 0.25 8.41421 0.25 8C0.25 7.58579 0.585787 7.25 1 7.25H15C15.4142 7.25 15.75 7.58579 15.75 8Z"
                ></path>
                <path
                    fillRule="evenodd"
                    d="M12.9188 4.66077C12.1212 3.0655 9.85918 3.02513 9.00512 4.59091L7.39321 7.54607L3.46959 11.4697C3.1767 11.7626 3.1767 12.2375 3.46959 12.5304C3.76248 12.8232 4.23736 12.8233 4.53025 12.5304L8.32997 8.73063C8.46043 8.76111 8.60067 8.75702 8.73708 8.71154L11.642 7.74323C12.9169 7.31828 13.5198 5.86272 12.9188 4.66077ZM9.46001 6.88943L11.1677 6.32021C11.5766 6.18391 11.7699 5.71708 11.5772 5.33159C11.3214 4.81995 10.5959 4.807 10.322 5.30919L9.46001 6.88943Z"
                ></path>
                <path
                    fillRule="evenodd"
                    d="M3.08102 4.66077C3.87866 3.0655 6.14065 3.02513 6.99472 4.59091L8.60663 7.54607L12.5302 11.4697C12.8231 11.7626 12.8231 12.2375 12.5302 12.5304C12.2374 12.8232 11.7625 12.8233 11.4696 12.5304L7.66987 8.73063C7.53941 8.76111 7.39917 8.75702 7.26275 8.71154L4.35782 7.74323C3.08296 7.31828 2.48005 5.86272 3.08102 4.66077ZM6.53982 6.88943L4.83216 6.32021C4.42328 6.18391 4.22992 5.71708 4.42266 5.33159C4.67848 4.81995 5.40395 4.807 5.67787 5.30919L6.53982 6.88943Z"
                ></path>
                <path
                    fillRule="evenodd"
                    d="M13 1.5H3C2.17157 1.5 1.5 2.17157 1.5 3V13C1.5 13.8284 2.17157 14.5 3 14.5H13C13.8284 14.5 14.5 13.8284 14.5 13V3C14.5 2.17157 13.8284 1.5 13 1.5ZM3 0C1.34315 0 0 1.34315 0 3V13C0 14.6569 1.34315 16 3 16H13C14.6569 16 16 14.6569 16 13V3C16 1.34315 14.6569 0 13 0H3Z"
                ></path>
            </svg>
            {alt ? <span className="sr-only">{alt}</span> : null}
        </>
    );
};
