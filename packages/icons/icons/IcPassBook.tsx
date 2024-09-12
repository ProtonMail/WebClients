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

export const IcPassBook = ({ alt, title, size = 4, className = '', viewBox = '0 0 16 16', ...rest }: IconProps) => {
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
                    d="M1.36311 1.64443C2.12753 1.23681 3.14908 1 4.25 1C5.35092 1 6.37247 1.23681 7.13689 1.64443C7.46201 1.8178 7.7636 2.03638 8 2.29671C8.2364 2.03638 8.53799 1.8178 8.86311 1.64443C9.62753 1.23681 10.6491 1 11.75 1C12.8509 1 13.8725 1.23681 14.6369 1.64443C15.3799 2.04063 16 2.67297 16 3.5V14.5C16 14.7761 15.7761 15 15.5 15C15.2239 15 15 14.7761 15 14.5C15 14.222 14.7806 13.8544 14.1664 13.5268C13.5735 13.2107 12.7201 13 11.75 13C10.7799 13 9.92647 13.2107 9.33364 13.5268C8.71937 13.8544 8.5 14.222 8.5 14.5C8.5 14.7761 8.27614 15 8 15C7.72386 15 7.5 14.7761 7.5 14.5C7.5 14.222 7.28063 13.8544 6.66636 13.5268C6.07353 13.2107 5.22008 13 4.25 13C3.27992 13 2.42647 13.2107 1.83364 13.5268C1.21937 13.8544 1 14.222 1 14.5C1 14.7761 0.776142 15 0.5 15C0.223858 15 0 14.7761 0 14.5V3.5C0 2.67297 0.620129 2.04063 1.36311 1.64443ZM1 12.8649C1.11595 12.7848 1.23778 12.7113 1.36311 12.6444C2.12753 12.2368 3.14908 12 4.25 12C5.35092 12 6.37247 12.2368 7.13689 12.6444C7.26222 12.7113 7.38405 12.7848 7.5 12.8649V3.5C7.5 3.22203 7.28063 2.85437 6.66636 2.52682C6.07353 2.21069 5.22008 2 4.25 2C3.27992 2 2.42647 2.21069 1.83364 2.52682C1.21937 2.85437 1 3.22203 1 3.5V12.8649ZM8.5 12.8649V3.5C8.5 3.22203 8.71937 2.85437 9.33364 2.52682C9.92647 2.21069 10.7799 2 11.75 2C12.7201 2 13.5735 2.21069 14.1664 2.52682C14.7806 2.85437 15 3.22203 15 3.5V12.8649C14.8841 12.7848 14.7622 12.7113 14.6369 12.6444C13.8725 12.2368 12.8509 12 11.75 12C10.6491 12 9.62753 12.2368 8.86311 12.6444C8.73778 12.7113 8.61595 12.7848 8.5 12.8649Z"
                ></path>
            </svg>
            {alt ? <span className="sr-only">{alt}</span> : null}
        </>
    );
};
