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

export const IcFire = ({ alt, title, size = 4, className = '', viewBox = '0 0 16 16', ...rest }: IconProps) => {
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
                    d="M4.966 6.764a5.839 5.839 0 0 0 1.896-2.74 5.664 5.664 0 0 0 .276-1.839c1.954.548 3.1 2.134 3.1 3.966 0 1.099-.62 2.212-1.48 2.955a9.098 9.098 0 0 1-.01.009c-.038.033-.12.103-.186.175-.06.065-.3.327-.304.742-.003.425.242.819.625 1.002.351.168.67.092.783.06.099-.029.199-.072.238-.09.004 0 .007-.002.01-.003.773-.33 1.797-1.012 2.584-2.348.026 1.067-.167 2.163-.755 3.087l-.016.025-.014.026a4.206 4.206 0 0 1-1.226 1.37 4.469 4.469 0 0 1-1.735.75 4.58 4.58 0 0 1-1.912-.025 4.453 4.453 0 0 1-1.71-.798c-.5-.381-.903-.86-1.183-1.402a3.96 3.96 0 0 1-.081-3.483 4.158 4.158 0 0 1 1.1-1.439Zm-.784-.642a5.147 5.147 0 0 0-1.225 1.662 4.959 4.959 0 0 0 .101 4.361c.35.675.85 1.269 1.465 1.738.615.47 1.33.803 2.095.977.764.175 1.56.186 2.33.033a5.47 5.47 0 0 0 2.123-.92 5.205 5.205 0 0 0 1.516-1.696c1.125-1.77 1.02-3.94.686-5.476a9.987 9.987 0 0 0-.197-.757 8.275 8.275 0 0 0-.271-.758c-.036-.084-.054-.126-.092-.141a.107.107 0 0 0-.098.013c-.033.025-.04.074-.055.174a9.995 9.995 0 0 1-.142.768 8.417 8.417 0 0 1-.247.875c-.504 1.454-1.292 2.275-1.975 2.737a4.088 4.088 0 0 1-.675.37c-.11.046-.165.07-.206.05a.105.105 0 0 1-.057-.091c0-.045.052-.09.154-.178a5.06 5.06 0 0 0 .055-.048c.162-.144.318-.3.466-.466.638-.72 1.122-1.636 1.263-2.618.028-.191.042-.384.042-.58 0-2.438-1.635-4.474-4.218-5.024a8.352 8.352 0 0 0-.378-.068 6.786 6.786 0 0 0-.461-.054C6.107 1 6.07.996 6.044 1.01a.1.1 0 0 0-.048.055c-.01.028 0 .066.018.142a4.663 4.663 0 0 1-.103 2.509 4.827 4.827 0 0 1-1.571 2.27h-.001v-.001c-.054.045-.106.09-.157.137Z"
                ></path>
            </svg>
            {alt ? <span className="sr-only">{alt}</span> : null}
        </>
    );
};
