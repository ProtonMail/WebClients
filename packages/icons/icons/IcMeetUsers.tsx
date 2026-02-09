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

export const IcMeetUsers = ({ alt, title, size = 4, className = '', viewBox = '0 0 16 16', ...rest }: IconProps) => {
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

                <path d="M5.88009 7.50961C5.88009 6.78721 5.29451 6.20163 4.57211 6.20163C3.84971 6.20163 3.26413 6.78721 3.26413 7.50961C3.26413 8.23201 3.84971 8.81759 4.57211 8.81759C5.29451 8.81759 5.88009 8.23201 5.88009 7.50961ZM7.18328 7.50961C7.18328 8.9517 6.0142 10.1208 4.57211 10.1208C3.13002 10.1208 1.96094 8.9517 1.96094 7.50961C1.96094 6.06752 3.13002 4.89844 4.57211 4.89844C6.0142 4.89844 7.18328 6.06752 7.18328 7.50961Z"></path>
                <path d="M4.57074 10.7773C7.09494 10.7773 9.14149 12.8239 9.14149 15.3481C9.14149 15.7079 8.84974 15.9997 8.48989 15.9997H0.651597C0.291751 15.9997 0 15.7079 0 15.3481C0 12.8239 2.04655 10.7773 4.57074 10.7773ZM4.57074 12.0805C2.98937 12.0805 1.67032 13.2041 1.36826 14.6965H7.77323C7.47117 13.2041 6.15212 12.0805 4.57074 12.0805Z"></path>
                <path d="M12.7395 2.61117C12.7395 1.88877 12.1539 1.30319 11.4315 1.30319C10.7091 1.30319 10.1235 1.88877 10.1235 2.61117C10.1235 3.33357 10.7091 3.91915 11.4315 3.91915C12.1539 3.91915 12.7395 3.33357 12.7395 2.61117ZM14.0427 2.61117C14.0427 4.05326 12.8736 5.22234 11.4315 5.22234C9.98939 5.22234 8.82031 4.05326 8.82031 2.61117C8.82031 1.16908 9.98939 0 11.4315 0C12.8736 0 14.0427 1.16908 14.0427 2.61117Z"></path>
                <path d="M11.4292 5.87891C13.9534 5.87891 15.9999 7.92546 15.9999 10.4497C15.9999 10.8095 15.7082 11.1012 15.3483 11.1012H8.97972C8.61988 11.1012 8.32812 10.8095 8.32812 10.4497C8.32812 10.0898 8.61988 9.79805 8.97972 9.79805H14.6317C14.3296 8.30571 13.0106 7.1821 11.4292 7.1821C10.6558 7.1821 9.94695 7.44939 9.38733 7.8978C9.10661 8.12279 8.69673 8.07793 8.47165 7.79734C8.24666 7.51662 8.29152 7.10674 8.57211 6.88166C9.35476 6.2544 10.349 5.87891 11.4292 5.87891Z"></path>
            </svg>
            {alt ? <span className="sr-only">{alt}</span> : null}
        </>
    );
};
