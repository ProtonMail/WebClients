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

export const IcBookmark = ({ alt, title, size = 4, className = '', viewBox = '0 0 16 16', ...rest }: IconProps) => {
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
                    d="M11.6 2H4.4c-.437 0-.704 0-.904.017a1.281 1.281 0 0 0-.215.034.5.5 0 0 0-.23.23 1.281 1.281 0 0 0-.034.215c-.016.2-.017.467-.017.904V13.585l.232-.231 3.835-3.835.007-.008c.031-.03.089-.088.147-.138a1.2 1.2 0 0 1 1.557 0 2.509 2.509 0 0 1 .155.146l3.835 3.835.231.23.001-.326V3.4c0-.437 0-.704-.017-.904a1.29 1.29 0 0 0-.034-.215l-.004-.008a.5.5 0 0 0-.226-.222 1.281 1.281 0 0 0-.215-.034c-.2-.016-.468-.017-.904-.017Zm-9.437-.181C2 2.139 2 2.559 2 3.4v9.857c0 .86 0 1.29.17 1.49a.71.71 0 0 0 .596.247c.26-.02.565-.325 1.173-.933l3.835-3.835c.079-.079.119-.119.164-.133a.2.2 0 0 1 .124 0c.045.014.085.054.164.133l3.835 3.835c.608.608.912.912 1.173.933a.71.71 0 0 0 .596-.247c.17-.2.17-.63.17-1.49V3.4c0-.84 0-1.26-.164-1.581a1.5 1.5 0 0 0-.655-.656C12.861 1 12.441 1 11.6 1H4.4c-.84 0-1.26 0-1.581.163a1.5 1.5 0 0 0-.656.656Z"
                ></path>
            </svg>
            {alt ? <span className="sr-only">{alt}</span> : null}
        </>
    );
};
