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

export const IcMeetSend = ({ alt, title, size = 4, className = '', viewBox = '0 0 16 16', ...rest }: IconProps) => {
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
                    d="M12.4444 7.5067L2.21323 2.39681L3.39694 7.50088L12.4444 7.5067ZM3.39098 8.50088L12.4024 8.50668L2.21886 13.6042L3.39098 8.50088ZM1.01438 1.65381C0.912934 1.21446 1.36761 0.855845 1.77013 1.05772L14.7057 7.51829C15.0978 7.71497 15.0982 8.27558 14.7063 8.47175L1.77907 14.9426C1.3768 15.1439 0.921663 14.7847 1.02254 14.3455L2.42789 8.22682C2.46411 8.06912 2.464 7.90517 2.42758 7.74742L1.01438 1.65381Z"
                ></path>
                <path
                    d="M2.42789 8.22682L1.02254 14.3455C0.921663 14.7847 1.3768 15.1439 1.77907 14.9426L14.7063 8.47175C15.0982 8.27558 15.0978 7.71497 14.7057 7.51829L1.77013 1.05772C1.36761 0.855845 0.912934 1.21446 1.01438 1.65381L2.42758 7.74742C2.464 7.90517 2.46411 8.06912 2.42789 8.22682ZM2.42789 8.22682L2.4301 8.22733M2.21323 2.39681L12.4444 7.5067L3.39694 7.50088L2.21323 2.39681ZM3.39098 8.50088L12.4024 8.50668L2.21886 13.6042L3.39098 8.50088Z"
                    strokeWidth="0.5"
                ></path>
            </svg>
            {alt ? <span className="sr-only">{alt}</span> : null}
        </>
    );
};
