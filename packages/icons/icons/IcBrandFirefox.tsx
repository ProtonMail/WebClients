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

export const IcBrandFirefox = ({ alt, title, size = 4, className = '', viewBox = '0 0 16 16', ...rest }: IconProps) => {
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

                <path d="M6.085 4.923c.005 0 .003 0 0 0Zm-1.688-.844c.005 0 .003 0 0 0Zm10.099 1.303c-.305-.733-.922-1.524-1.406-1.774.394.773.622 1.548.71 2.127v.012c-.792-1.976-2.136-2.772-3.234-4.507-.055-.088-.11-.175-.165-.268a2.145 2.145 0 0 1-.077-.145 1.281 1.281 0 0 1-.109-.29.018.018 0 0 0-.011-.006.024.024 0 0 0-.013 0l-.004.002-.005.003.003-.004c-1.559.913-2.205 2.51-2.37 3.528a3.735 3.735 0 0 0-1.39.354.18.18 0 0 0-.089.223.176.176 0 0 0 .24.103c.38-.18.79-.287 1.21-.316l.04-.003a3.42 3.42 0 0 1 1.18.133l.056.018a3.5 3.5 0 0 1 .514.206l.065.032a3.513 3.513 0 0 1 .223.128c.507.314.929.75 1.225 1.268-.374-.263-1.044-.523-1.69-.41 2.521 1.26 1.845 5.6-1.649 5.436a3.107 3.107 0 0 1-.912-.176 3.821 3.821 0 0 1-.324-.14c-.856-.443-1.563-1.279-1.651-2.294 0 0 .323-1.206 2.317-1.206.215 0 .831-.6.842-.775C8.02 6.584 6.8 6.099 6.324 5.63c-.254-.25-.375-.371-.481-.462a2.09 2.09 0 0 0-.182-.137 3.247 3.247 0 0 1-.02-1.713c-.72.328-1.28.846-1.687 1.304h-.003c-.278-.352-.258-1.513-.243-1.756-.003-.015-.207.106-.234.125a5.11 5.11 0 0 0-.685.586c-.24.243-.458.506-.654.785v.001c-.45.638-.77 1.36-.94 2.123a7.966 7.966 0 0 0-.115.646 7.745 7.745 0 0 0-.064.566l-.001.021L1 7.952v.036a7.009 7.009 0 0 0 13.918 1.186c.012-.09.022-.18.032-.27.14-1.202-.015-2.466-.454-3.522Z"></path>
            </svg>
            {alt ? <span className="sr-only">{alt}</span> : null}
        </>
    );
};
