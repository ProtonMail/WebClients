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

export const IcPassHeart = ({ alt, title, size = 4, className = '', viewBox = '0 0 16 16', ...rest }: IconProps) => {
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
                    d="M12.0619 2.14063C11.2159 1.90936 10.3174 1.96324 9.50516 2.29392C8.92228 2.53122 8.40716 2.90158 7.99869 3.37135C7.79088 3.13341 7.55498 2.92033 7.29555 2.73703C6.83443 2.41123 6.30945 2.18695 5.75527 2.079C5.20109 1.97105 4.63031 1.98188 4.08062 2.11078C3.53094 2.23968 3.01484 2.48371 2.56642 2.82677C2.11799 3.16982 1.74744 3.6041 1.47922 4.10092C1.21101 4.59774 1.05123 5.1458 1.01043 5.70893C0.969641 6.27205 1.04876 6.83742 1.24258 7.36771C1.43639 7.898 1.74095 8.38162 2.13525 8.78573L7.64225 14.4147C7.73643 14.511 7.86546 14.5652 8.00013 14.5651C8.1348 14.5649 8.26372 14.5105 8.35772 14.414L13.684 8.94909C14.0949 8.57901 14.4241 8.12729 14.6506 7.62273C14.8796 7.11287 14.9985 6.56049 14.9997 6.0016C15.0023 5.12463 14.716 4.27122 14.185 3.57331C13.654 2.8754 12.9078 2.37189 12.0619 2.14063ZM11.7982 3.10523C11.1642 2.93193 10.4909 2.9723 9.88223 3.2201C9.27356 3.4679 8.76349 3.90933 8.43089 4.47612C8.34122 4.62892 8.17739 4.72286 8.00023 4.72307C7.82307 4.72327 7.65902 4.62971 7.569 4.47712C7.35399 4.11264 7.06412 3.79793 6.71851 3.55374C6.3729 3.30956 5.97943 3.14146 5.56407 3.06055C5.14871 2.97964 4.72092 2.98776 4.30892 3.08437C3.89693 3.18098 3.51012 3.36388 3.17403 3.621C2.83794 3.87812 2.56021 4.20361 2.35918 4.57598C2.15815 4.94834 2.03839 5.35912 2.00782 5.78118C1.97725 6.20324 2.03655 6.62698 2.18181 7.02444C2.32705 7.42181 2.5549 7.78386 2.85035 8.0867L7.99897 13.3494L12.9796 8.23909C12.9877 8.23078 12.9961 8.22276 13.0047 8.21504C13.317 7.93634 13.5669 7.59495 13.7384 7.21313C13.9098 6.83131 13.9988 6.41764 13.9997 5.9991C14.0017 5.34193 13.7871 4.70184 13.3892 4.17884C12.9912 3.65585 12.4321 3.27853 11.7982 3.10523Z"
                ></path>
            </svg>
            {alt ? <span className="sr-only">{alt}</span> : null}
        </>
    );
};
