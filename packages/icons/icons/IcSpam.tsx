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

export const IcSpam = ({ alt, title, size = 4, className = '', viewBox = '0 0 16 16', ...rest }: IconProps) => {
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

                <path d="m7.94153 4c.56624 0 1.00436.49628.93412 1.05816l-.43798 3.50386c-.03128.25021-.24398.43798-.49614.43798s-.46486-.18777-.49614-.43798l-.43798-3.50386c-.07024-.56188.36787-1.05816.93412-1.05816z"></path>
                <path d="m7.94147 11.4c.3866 0 .7-.3134.7-.7s-.3134-.7-.7-.7-.7.3134-.7.7.3134.7.7.7z"></path>
                <path
                    clipRule="evenodd"
                    d="m5.41421 14h5.17159l3.4142-3.4142v-5.17159l-3.4142-3.41421h-5.17159l-3.41421 3.41421v5.17159zm0-13c-.26521 0-.51957.10536-.7071.29289l-3.41422 3.41422c-.18753.18753-.29289.44189-.29289.7071v5.17159c0 .2652.10536.5196.29289.7071l3.41422 3.4142c.18753.1875.44189.2929.7071.2929h5.17159c.2652 0 .5196-.1054.7071-.2929l3.4142-3.4142c.1875-.1875.2929-.4419.2929-.7071v-5.17159c0-.26521-.1054-.51957-.2929-.7071l-3.4142-3.41422c-.1875-.18753-.4419-.29289-.7071-.29289z"
                    fillRule="evenodd"
                ></path>
            </svg>
            {alt ? <span className="sr-only">{alt}</span> : null}
        </>
    );
};
