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

export const IcBell = ({ alt, title, size = 4, className = '', viewBox = '0 0 16 16', ...rest }: IconProps) => {
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
                    d="m13.181 10.68 1.315 1.316.006.006.029.028c.304.305.456.457.466.587a.355.355 0 0 1-.123.298c-.1.085-.315.085-.745.085H1.857c-.424 0-.636 0-.734-.084A.35.35 0 0 1 1 12.623c.01-.13.16-.28.46-.579l.039-.04.008-.007 1.316-1.316a.616.616 0 0 0 .18-.436V5.998a4.998 4.998 0 0 1 9.997 0v4.247c0 .163.065.32.18.436Zm-.707.707.612.613H2.92l.612-.613c.303-.303.473-.714.473-1.142V5.998a3.998 3.998 0 0 1 7.997 0v4.247c0 .428.17.84.473 1.143ZM8.003 15a1 1 0 0 1-1-1h2a1 1 0 0 1-1 1Z"
                ></path>
            </svg>
            {alt ? <span className="sr-only">{alt}</span> : null}
        </>
    );
};
