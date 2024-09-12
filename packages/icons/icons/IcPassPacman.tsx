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

export const IcPassPacman = ({ alt, title, size = 4, className = '', viewBox = '0 0 16 16', ...rest }: IconProps) => {
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

                <path d="M9.5 4.5C9.5 5.05228 9.05228 5.5 8.5 5.5C7.94772 5.5 7.5 5.05228 7.5 4.5C7.5 3.94772 7.94772 3.5 8.5 3.5C9.05228 3.5 9.5 3.94772 9.5 4.5Z"></path>
                <path
                    fillRule="evenodd"
                    clipRule="evenodd"
                    d="M5.9244 0.272118C7.62587 -0.18337 9.43011 -0.0645911 11.0572 0.610027C12.6843 1.28465 14.0432 2.47739 14.9232 4.0032C15.0611 4.24233 14.9792 4.54799 14.7401 4.68602L9.00009 8L14.7401 11.314C14.9792 11.452 15.0611 11.7577 14.9232 11.9968C14.0432 13.5226 12.6843 14.7154 11.0572 15.39C9.43011 16.0646 7.62587 16.1834 5.9244 15.7279C4.22292 15.2724 2.71933 14.2681 1.6469 12.8708C0.574472 11.4735 -0.00683594 9.76139 -0.00683594 8C-0.00683594 6.23861 0.574472 4.52646 1.6469 3.12918C2.71933 1.7319 4.22292 0.727607 5.9244 0.272118ZM10.6742 1.53377C9.25049 0.943483 7.67178 0.839552 6.18299 1.2381C4.6942 1.63666 3.37856 2.51541 2.44018 3.73803C1.50181 4.96065 0.993164 6.45879 0.993164 8C0.993164 9.54122 1.50181 11.0394 2.44018 12.262C3.37856 13.4846 4.6942 14.3633 6.18299 14.7619C7.67178 15.1605 9.25049 15.0565 10.6742 14.4662C11.9434 13.94 13.0262 13.0534 13.7918 11.9212L7.75009 8.43302C7.59539 8.3437 7.50009 8.17864 7.50009 8C7.50009 7.82137 7.59539 7.65631 7.75009 7.56699L13.7918 4.0788C13.0262 2.94662 11.9434 2.06003 10.6742 1.53377Z"
                ></path>
                <path d="M14.5 9.5C15.3284 9.5 16 8.82843 16 8C16 7.17157 15.3284 6.5 14.5 6.5C13.6716 6.5 13 7.17157 13 8C13 8.82843 13.6716 9.5 14.5 9.5Z"></path>
            </svg>
            {alt ? <span className="sr-only">{alt}</span> : null}
        </>
    );
};
