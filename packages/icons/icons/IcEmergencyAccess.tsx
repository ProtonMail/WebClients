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

export const IcEmergencyAccess = ({
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

                <path d="M7.99897 9V10H4.99897C4.5269 10 4.08207 10.222 3.79878 10.5996L2.59858 12.2002C2.35175 12.5298 2.58708 13 2.99897 13H6.99897V14H2.99897C1.76291 14 1.05714 12.5885 1.79878 11.5996L2.99897 10C3.47111 9.37049 4.21208 9 4.99897 9H7.99897Z"></path>
                <path d="M11.999 7C13.1035 7 13.999 7.89543 13.999 9V10.0244C14.5696 10.1402 14.999 10.6452 14.999 11.25V13.75L14.9921 13.8779C14.9281 14.5082 14.3961 15 13.749 15H10.249L10.121 14.9932C9.4908 14.9291 8.99897 14.3972 8.99897 13.75V11.25C8.99897 10.6453 9.42843 10.1412 9.99897 10.0254V9C9.99897 7.89543 10.8944 7 11.999 7ZM10.249 11C10.1109 11 9.99897 11.1119 9.99897 11.25V13.75C9.99897 13.8881 10.1109 14 10.249 14H13.749C13.887 14 13.999 13.8881 13.999 13.75V11.25C13.999 11.1119 13.887 11 13.749 11H10.249ZM11.999 8C11.4467 8 10.999 8.44772 10.999 9V10H12.999V9C12.999 8.44772 12.5513 8 11.999 8Z"></path>
                <path
                    fillRule="evenodd"
                    clipRule="evenodd"
                    d="M8.99897 5C8.99897 6.10457 8.10354 7 6.99897 7C5.89441 7 4.99897 6.10457 4.99897 5C4.99897 3.89543 5.89441 3 6.99897 3C8.10354 3 8.99897 3.89543 8.99897 5ZM9.99897 5C9.99897 6.65685 8.65583 8 6.99897 8C5.34212 8 3.99897 6.65685 3.99897 5C3.99897 3.34315 5.34212 2 6.99897 2C8.65583 2 9.99897 3.34315 9.99897 5Z"
                ></path>
            </svg>
            {alt ? <span className="sr-only">{alt}</span> : null}
        </>
    );
};
