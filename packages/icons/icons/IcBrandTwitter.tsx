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

export const IcBrandTwitter = ({ alt, title, size = 4, className = '', viewBox = '0 0 16 16', ...rest }: IconProps) => {
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

                <path d="M9.48842 6.77143L15.3137 0H13.9333L8.8752 5.87954L4.83532 0H0.175781L6.28489 8.8909L0.175781 15.9918H1.55627L6.89775 9.78279L11.1642 15.9918H15.8237L9.48808 6.77143H9.48842ZM7.59766 8.96923L6.97868 8.0839L2.05368 1.03921H4.17402L8.14855 6.7245L8.76753 7.60983L13.934 14.9998H11.8136L7.59766 8.96957V8.96923Z"></path>
            </svg>
            {alt ? <span className="sr-only">{alt}</span> : null}
        </>
    );
};
