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

export const IcDeviceDataBackup = ({
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

                <path d="M14 8.83301C13.9998 8.37303 13.627 8.00018 13.167 8H11.833C11.373 8.00018 11.0002 8.37303 11 8.83301V13.165C11 13.6252 11.3729 13.9988 11.833 13.999H13.167C13.6271 13.9988 14 13.6252 14 13.165V8.83301ZM1 8.66699V3.83301C1.00009 3.34689 1.19337 2.88085 1.53711 2.53711C1.88085 2.19337 2.34689 2.00009 2.83301 2H4.5V3H2.83301C2.61211 3.00009 2.40034 3.08794 2.24414 3.24414C2.08794 3.40034 2.00009 3.61211 2 3.83301V8.66699C2.00007 8.8879 2.08794 9.09964 2.24414 9.25586C2.40034 9.41206 2.61211 9.49991 2.83301 9.5L8.5 9.50098V10.501H8L7.5 10.5V12H8.5V13H4.5C4.22386 13 4 12.7761 4 12.5C4 12.2239 4.22386 12 4.5 12H6.5V10.5H2.83301C2.34689 10.4999 1.88085 10.3066 1.53711 9.96289C1.19337 9.61914 1.00007 9.15311 1 8.66699ZM6.5 2.5C6.5 2.22386 6.72386 2 7 2C7.27614 2 7.5 2.22386 7.5 2.5V5.95996L8.64648 4.81348C8.84175 4.61824 9.15827 4.61823 9.35352 4.81348C9.54875 5.00875 9.54876 5.32526 9.35352 5.52051L7.35352 7.52051C7.15829 7.71556 6.8417 7.71555 6.64648 7.52051L4.64648 5.52051C4.45128 5.3253 4.45139 5.00875 4.64648 4.81348C4.84175 4.61821 5.15825 4.61821 5.35352 4.81348L6.5 5.95996V2.5ZM12.0039 5.16699V3.83301C12.0038 3.61213 11.916 3.40034 11.7598 3.24414C11.6036 3.08795 11.3918 3.0001 11.1709 3H9.5V2H11.1709C11.657 2.0001 12.1231 2.19338 12.4668 2.53711C12.8105 2.88085 13.0038 3.34691 13.0039 3.83301V5.16699C13.0037 5.44297 12.7799 5.66696 12.5039 5.66699C12.2279 5.66699 12.0041 5.44299 12.0039 5.16699ZM15 13.165C15 14.1775 14.1794 14.9988 13.167 14.999H11.833C10.8206 14.9988 10 14.1775 10 13.165V8.83301C10.0002 7.82074 10.8207 7.00018 11.833 7H13.167C14.1793 7.00018 14.9998 7.82074 15 8.83301V13.165Z"></path>
            </svg>
            {alt ? <span className="sr-only">{alt}</span> : null}
        </>
    );
};
