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

export const IcContactAssistedRecovery = ({
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
                    fillRule="evenodd"
                    clipRule="evenodd"
                    d="M8.99879 5C8.99879 6.10457 8.10336 7 6.99879 7C5.89422 7 4.99879 6.10457 4.99879 5C4.99879 3.89543 5.89422 3 6.99879 3C8.10336 3 8.99879 3.89543 8.99879 5ZM9.99879 5C9.99879 6.65685 8.65564 8 6.99879 8C5.34193 8 3.99879 6.65685 3.99879 5C3.99879 3.34315 5.34193 2 6.99879 2C8.65564 2 9.99879 3.34315 9.99879 5Z"
                ></path>
                <path d="M13.999 9.33789L12.499 8.7373V13.6504L12.7099 13.5342C13.5051 13.0937 13.9989 12.2567 13.999 11.3477V9.33789ZM6.99897 9V10H4.99897C4.52693 10 4.08207 10.222 3.79878 10.5996L2.59858 12.2002C2.35167 12.5298 2.58705 13 2.99897 13H7.49897V14H2.99897C1.76291 14 1.05714 12.5885 1.79878 11.5996L2.99897 10C3.47111 9.37053 4.21211 9 4.99897 9H6.99897ZM9.99897 11.3477C9.99902 12.2567 10.4928 13.0937 11.288 13.5342L11.499 13.6504V8.7373L9.99897 9.33789V11.3477ZM14.999 11.3477C14.9989 12.6203 14.3076 13.7926 13.1943 14.4092L12.2412 14.9375C12.0905 15.0209 11.9075 15.0209 11.7568 14.9375L10.8027 14.4092C9.68957 13.7925 8.99902 12.6202 8.99897 11.3477V9C8.99897 8.79555 9.1236 8.61206 9.31343 8.53613L11.8134 7.53613L11.9042 7.50879C11.9977 7.4908 12.095 7.50032 12.1845 7.53613L14.6845 8.53613C14.8743 8.61209 14.999 8.79559 14.999 9V11.3477Z"></path>
            </svg>
            {alt ? <span className="sr-only">{alt}</span> : null}
        </>
    );
};
