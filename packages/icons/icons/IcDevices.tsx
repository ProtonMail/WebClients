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

export const IcDevices = ({ alt, title, size = 4, className = '', viewBox = '0 0 16 16', ...rest }: IconProps) => {
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

                <path d="M13.333 2C14.3147 2.00012 15.1103 2.76725 15.1104 3.71387V4.57129H14.2217V3.71387C14.2216 3.24064 13.8238 2.85657 13.333 2.85645H3.55469C3.06403 2.85667 2.66612 3.2407 2.66602 3.71387V11.4287H9.77734V14H1.33301C0.596637 14 0 13.4239 0 12.7139C8.30819e-05 12.0039 0.596688 11.4287 1.33301 11.4287H1.77734V3.71387C1.77744 2.76732 2.57312 2.00022 3.55469 2H13.333ZM15.1104 5.42871C15.6012 5.42871 15.9989 5.81191 15.999 6.28516V13.1426C15.999 13.616 15.6013 14 15.1104 14H11.5547C11.0639 13.9998 10.666 13.6159 10.666 13.1426V6.28516C10.6662 5.81202 11.064 5.42888 11.5547 5.42871H15.1104ZM11.5547 11.4287H15.1104V6.28516H11.5547V11.4287Z"></path>
            </svg>
            {alt ? <span className="sr-only">{alt}</span> : null}
        </>
    );
};
