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

export const IcPrinter = ({ alt, title, size = 4, className = '', viewBox = '0 0 16 16', ...rest }: IconProps) => {
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

                <path d="M11 7.5a.5.5 0 1 1-1 0 .5.5 0 0 1 1 0Z"></path>
                <path d="M12.5 8a.5.5 0 1 0 0-1 .5.5 0 0 0 0 1Z"></path>
                <path
                    fillRule="evenodd"
                    d="M13 4.035V5h.5A1.5 1.5 0 0 1 15 6.5v5a1.5 1.5 0 0 1-1.5 1.5H13v1a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1v-1h-.5A1.5 1.5 0 0 1 1 11.5v-5A1.5 1.5 0 0 1 2.5 5H3V2.5A1.5 1.5 0 0 1 4.5 1h4.697a1.5 1.5 0 0 1 .832.252l2.303 1.535A1.5 1.5 0 0 1 13 4.035ZM4 2.5a.5.5 0 0 1 .5-.5h4.697a.5.5 0 0 1 .278.084l2.302 1.535a.5.5 0 0 1 .223.416V5H4V2.5ZM4 14h8v-4H4v4Zm9-2V9H3v3h-.5a.5.5 0 0 1-.5-.5v-5a.5.5 0 0 1 .5-.5h11a.5.5 0 0 1 .5.5v5a.5.5 0 0 1-.5.5H13Z"
                ></path>
            </svg>
            {alt ? <span className="sr-only">{alt}</span> : null}
        </>
    );
};
