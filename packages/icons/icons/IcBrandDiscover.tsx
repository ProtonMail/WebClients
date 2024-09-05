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

export const IcBrandDiscover = ({
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

                <path d="M1,3V13H15V3Zm13,9H2V4H14Z"></path>
                <polygon points="11.49 8.51 10.94 8.51 10.94 8.09 11.47 8.09 11.47 7.83 10.94 7.83 10.94 7.49 11.49 7.49 11.49 7.23 10.64 7.23 10.64 8.77 11.49 8.77 11.49 8.51"></polygon>
                <polygon points="9.83 8.81 10.5 7.23 10.18 7.23 9.76 8.27 9.34 7.23 9.01 7.23 9.67 8.81 9.83 8.81"></polygon>
                <path d="M12,8.15h0l.42.62h.37l-.48-.65a.41.41,0,0,0,.35-.44c0-.29-.2-.45-.55-.45h-.45V8.77H12Zm0-.68h.1c.19,0,.29.08.29.23s-.11.24-.3.24H12Z"></path>
                <path d="M4.45,8a.76.76,0,0,0-.83-.77H3.18V8.77h.44A.77.77,0,0,0,4.45,8Zm-1,.51v-1h.11A.49.49,0,0,1,4.14,8c0,.12,0,.51-.58.51Z"></path>
                <path d="M5.53,8.53a.35.35,0,0,1-.33-.2L5,8.51a.6.6,0,0,0,.54.3.49.49,0,0,0,.53-.51c0-.24-.1-.35-.44-.48-.18-.07-.24-.11-.24-.19a.21.21,0,0,1,.23-.18.31.31,0,0,1,.24.13L6,7.37a.68.68,0,0,0-.45-.17.46.46,0,0,0-.49.44c0,.21.1.32.38.43s.3.09.3.24A.22.22,0,0,1,5.53,8.53Z"></path>
                <rect x="4.59" y="7.23" width="0.3" height="1.54"></rect>
                <path d="M7,8.8a.9.9,0,0,0,.38-.08V8.36A.49.49,0,0,1,7,8.53.53.53,0,0,1,7,7.47a.53.53,0,0,1,.38.17V7.29A.77.77,0,0,0,7,7.19.82.82,0,0,0,6.17,8,.8.8,0,0,0,7,8.8Z"></path>
                <path d="M8.27,8.81A.8.8,0,0,0,9.07,8a.8.8,0,0,0-.8-.8.81.81,0,0,0-.82.8A.82.82,0,0,0,8.27,8.81Z"></path>
            </svg>
            {alt ? <span className="sr-only">{alt}</span> : null}
        </>
    );
};
