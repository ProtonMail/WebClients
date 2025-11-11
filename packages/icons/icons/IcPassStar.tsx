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

export const IcPassStar = ({ alt, title, size = 4, className = '', viewBox = '0 0 16 16', ...rest }: IconProps) => {
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
                    clipRule="evenodd"
                    d="M8.00003 0.23999C8.21863 0.23999 8.41188 0.381991 8.47719 0.590602L10.0984 5.76899H15.5C15.7152 5.76899 15.9062 5.90659 15.9743 6.11064C16.0424 6.3147 15.9724 6.53945 15.8004 6.6687L11.5019 9.89914L13.1936 15.1055C13.2605 15.3115 13.1872 15.5372 13.0119 15.6645C12.8367 15.7918 12.5994 15.7918 12.4241 15.6645L8.00003 12.45L3.57593 15.6645C3.40069 15.7918 3.16339 15.7918 2.98814 15.6645C2.8129 15.5372 2.73957 15.3115 2.8065 15.1055L4.49814 9.89914L0.199642 6.6687C0.0276674 6.53945 -0.0423605 6.3147 0.0257677 6.11064C0.0938959 5.90659 0.284907 5.76899 0.500032 5.76899H5.90164L7.52287 0.590602C7.58818 0.381991 7.78144 0.23999 8.00003 0.23999ZM8.00003 2.41348L6.74619 6.41838C6.68088 6.62699 6.48763 6.76899 6.26903 6.76899H1.99759L5.38442 9.31428C5.55521 9.44263 5.62558 9.66532 5.55956 9.8685L4.23311 13.9509L7.70613 11.4275C7.88138 11.3002 8.11869 11.3002 8.29393 11.4275L11.767 13.9509L10.4405 9.8685C10.3745 9.66532 10.4449 9.44263 10.6156 9.31428L14.0025 6.76899H9.73103C9.51244 6.76899 9.31918 6.62699 9.25387 6.41838L8.00003 2.41348Z"
                ></path>
            </svg>
            {alt ? <span className="sr-only">{alt}</span> : null}
        </>
    );
};
