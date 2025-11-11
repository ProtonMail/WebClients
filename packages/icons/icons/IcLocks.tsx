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

export const IcLocks = ({ alt, title, size = 4, className = '', viewBox = '0 0 16 16', ...rest }: IconProps) => {
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
                    d="M4.5 4h4a2 2 0 1 0-4 0Zm-1 0v.075a1.682 1.682 0 0 0-.408.143 2 2 0 0 0-.874.874c-.124.243-.173.501-.196.782C2 6.144 2 6.477 2 6.88v3.241c0 .403 0 .735.022 1.006.023.281.072.54.196.782a2 2 0 0 0 .874.874c.243.124.501.173.782.196.27.022.603.022 1.005.022H5c.005.582.028.916.163 1.181a1.5 1.5 0 0 0 .656.655c.32.164.74.164 1.581.164h4.2c.84 0 1.26 0 1.581-.164a1.5 1.5 0 0 0 .655-.655c.164-.32.164-.74.164-1.581V9.4c0-.84 0-1.26-.164-1.581a1.5 1.5 0 0 0-.655-.656c-.178-.09-.387-.13-.681-.149V7a3 3 0 0 0-3-3 3 3 0 0 0-6 0Zm.456 1.019C4.18 5 4.472 5 4.9 5h2.364A2.989 2.989 0 0 0 6.5 7v.014c-.294.018-.503.059-.681.15a1.5 1.5 0 0 0-.656.655C5 8.139 5 8.559 5 9.4V12h-.1c-.428 0-.72 0-.944-.019-.22-.018-.332-.05-.41-.09a1 1 0 0 1-.437-.437c-.04-.078-.072-.19-.09-.41A12.925 12.925 0 0 1 3 10.1V6.9c0-.428 0-.72.019-.944.018-.22.05-.332.09-.41a1 1 0 0 1 .437-.437c.078-.04.19-.072.41-.09ZM7.5 7a2 2 0 1 1 4 0h-4Zm4.1 1H7.4c-.437 0-.704 0-.904.017a1.281 1.281 0 0 0-.215.034.5.5 0 0 0-.23.23 1.282 1.282 0 0 0-.034.215c-.016.2-.017.467-.017.904v3.2c0 .437 0 .704.017.904a1.282 1.282 0 0 0 .034.215.5.5 0 0 0 .222.226l.008.004a1.29 1.29 0 0 0 .215.034c.2.016.467.017.904.017h4.2c.437 0 .704 0 .904-.017a1.29 1.29 0 0 0 .215-.034l.004-.002a.5.5 0 0 0 .223-.22v-.003l.003-.005a1.29 1.29 0 0 0 .034-.215c.016-.2.017-.468.017-.904V9.4c0-.437 0-.704-.017-.904a1.29 1.29 0 0 0-.034-.215l-.003-.006v-.002a.5.5 0 0 0-.227-.222 1.281 1.281 0 0 0-.215-.034c-.2-.016-.468-.017-.904-.017Zm-1.35 2.25a.75.75 0 0 1-.397.662l.327 1.308a.225.225 0 0 1-.218.28h-.924a.225.225 0 0 1-.218-.28l.327-1.308a.75.75 0 1 1 1.103-.662Z"
                ></path>
            </svg>
            {alt ? <span className="sr-only">{alt}</span> : null}
        </>
    );
};
