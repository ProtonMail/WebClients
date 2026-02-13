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

export const IcPerson2 = ({ alt, title, size = 4, className = '', viewBox = '0 0 16 16', ...rest }: IconProps) => {
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
                    d="M5.5 8c.998 0 2.208.243 3.122.857.804.54 1.378 1.369 1.378 2.572l-.009.452C9.91 14 9.25 14 9.25 14h-7.5s-.659 0-.741-2.12L1 11.43c0-1.128.505-1.926 1.23-2.467l.148-.105C3.292 8.243 4.502 8 5.5 8Zm0 1c-.87 0-1.865.218-2.563.688-.57.382-.937.917-.937 1.74 0 .872.094 1.34.168 1.572h6.664c.074-.231.168-.7.168-1.571 0-.824-.368-1.36-.937-1.742C7.365 9.217 6.37 9 5.5 9Z"
                    clipRule="evenodd"
                ></path>
                <path d="M11 8c.887 0 1.962.243 2.774.857.715.54 1.226 1.369 1.226 2.572l-.008.452C14.92 14 14.333 14 14.333 14h-3.751c.128-.27.23-.598.3-1h2.973c.066-.252.145-.728.145-1.571 0-.874-.351-1.414-.828-1.775C12.58 9.207 11.737 9 11 9c-.238 0-.487.023-.735.067a4.153 4.153 0 0 0-.8-.83A5.203 5.203 0 0 1 11 8Z"></path>
                <path
                    fillRule="evenodd"
                    d="M5.5 2a2.5 2.5 0 1 1 0 5 2.5 2.5 0 0 1 0-5Zm0 1a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3ZM11 3a2 2 0 1 1 0 4 2 2 0 0 1 0-4Zm0 1a1 1 0 1 0 0 2 1 1 0 0 0 0-2Z"
                    clipRule="evenodd"
                ></path>
            </svg>
            {alt ? <span className="sr-only">{alt}</span> : null}
        </>
    );
};
