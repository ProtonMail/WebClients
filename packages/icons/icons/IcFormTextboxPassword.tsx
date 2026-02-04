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

export const IcFormTextboxPassword = ({
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
                    d="M11.3333 4.66631H14.6666V11.3329H11.3333V12.6662C11.3333 12.843 11.4035 13.0126 11.5285 13.1376C11.6536 13.2627 11.8231 13.3329 11.9999 13.3329H13.3333V14.6662H11.6666C11.2999 14.6662 10.6666 14.3662 10.6666 13.9995C10.6666 14.3662 10.0333 14.6662 9.66662 14.6662H7.99997V13.3329H9.33329C9.5101 13.3329 9.67967 13.2627 9.80469 13.1376C9.92972 13.0126 9.99995 12.843 9.99995 12.6662V3.33299C9.99995 3.15618 9.92972 2.98661 9.80469 2.86159C9.67967 2.73657 9.5101 2.66633 9.33329 2.66633H7.99997V1.33301H9.66662C10.0333 1.33301 10.6666 1.633 10.6666 1.99967C10.6666 1.633 11.2999 1.33301 11.6666 1.33301H13.3333V2.66633H11.9999C11.8231 2.66633 11.6536 2.73657 11.5285 2.86159C11.4035 2.98661 11.3333 3.15618 11.3333 3.33299V4.66631ZM1.33337 4.66631H8.66663V5.99963H2.66669V9.99959H8.66663V11.3329H1.33337V4.66631ZM13.3333 9.99959V5.99963H11.3333V9.99959H13.3333ZM5.66666 7.99961C5.66666 7.73439 5.56131 7.48004 5.37377 7.29251C5.18624 7.10497 4.93189 6.99962 4.66667 6.99962C4.40146 6.99962 4.14711 7.10497 3.95957 7.29251C3.77204 7.48004 3.66668 7.73439 3.66668 7.99961C3.66668 8.26482 3.77204 8.51917 3.95957 8.70671C4.14711 8.89424 4.40146 8.9996 4.66667 8.9996C4.93189 8.9996 5.18624 8.89424 5.37377 8.70671C5.56131 8.51917 5.66666 8.26482 5.66666 7.99961ZM8.66663 7.25962C8.25997 6.88629 7.62664 6.91962 7.25331 7.33295C6.87999 7.73294 6.91332 8.36627 7.33331 8.7396C7.69998 9.08626 8.28664 9.08626 8.66663 8.7396V7.25962Z"
                    fill="#0C0C14"
                ></path>
            </svg>
            {alt ? <span className="sr-only">{alt}</span> : null}
        </>
    );
};
