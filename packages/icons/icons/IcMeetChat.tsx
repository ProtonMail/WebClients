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

export const IcMeetChat = ({ alt, title, size = 4, className = '', viewBox = '0 0 16 16', ...rest }: IconProps) => {
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
                    d="M14.8333 2.83301C14.8331 2.46468 14.5346 2.16699 14.1663 2.16699H2.16626C1.79804 2.16717 1.50042 2.46479 1.50024 2.83301V10.167C1.50042 10.5352 1.79804 10.8328 2.16626 10.833H5.82056L6.02075 11.084L8.16626 13.7656L10.3127 11.084L10.5129 10.833H14.1663C14.5346 10.833 14.8331 10.5353 14.8333 10.167V2.83301ZM16.1663 10.167C16.1661 11.2717 15.271 12.167 14.1663 12.167H11.1526L8.16626 15.9004L5.18091 12.167H2.16626C1.06166 12.1668 0.166435 11.2716 0.16626 10.167V2.83301C0.166436 1.72841 1.06166 0.833184 2.16626 0.833008H14.1663C15.271 0.833008 16.1661 1.7283 16.1663 2.83301V10.167Z"
                    fill="currentColor"
                ></path>
                <path d="M12.1663 4.16602V5.5H4.16626V4.16602H12.1663Z" fill="currentColor"></path>
                <path d="M9.50024 7.5V8.83398H4.16626V7.5H9.50024Z" fill="currentColor"></path>
            </svg>
            {alt ? <span className="sr-only">{alt}</span> : null}
        </>
    );
};
