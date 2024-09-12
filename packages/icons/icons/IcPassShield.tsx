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

export const IcPassShield = ({ alt, title, size = 4, className = '', viewBox = '0 0 16 16', ...rest }: IconProps) => {
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
                    d="M8.3533 0.146447C8.15803 -0.0488155 7.84145 -0.0488155 7.64619 0.146447C6.22268 1.56995 3.82193 3.02032 0.429029 3.50503C0.182705 3.54021 -0.000488281 3.75117 -0.000488281 4L-0.000258937 4.00125L-0.000253543 4.00328L-0.00021933 4.00966L1.88202e-05 4.03155C0.000281915 4.05014 0.000792399 4.07668 0.00178204 4.11072C0.0037611 4.1788 0.00765781 4.27697 0.0153304 4.40177C0.0306704 4.6513 0.0611359 5.00786 0.121681 5.44378C0.24262 6.31454 0.484418 7.50814 0.969075 8.80056C1.9345 11.375 3.87596 14.3673 7.75693 15.9412C7.82877 15.9787 7.91149 16 7.99951 16L8.0027 16C8.08886 15.9995 8.16986 15.9785 8.24045 15.9421C12.1228 14.3684 14.0648 11.3755 15.0304 8.80056C15.5151 7.50814 15.7569 6.31454 15.8778 5.44378C15.9383 5.00786 15.9688 4.6513 15.9841 4.40177C15.9918 4.27697 15.9957 4.1788 15.9977 4.11072C15.9987 4.07668 15.9992 4.05014 15.9995 4.03155L15.9997 4.00966L15.9997 4.00328L15.9997 4.00125V4C15.9997 3.75117 15.8168 3.54021 15.5705 3.50503C12.1776 3.02032 9.7768 1.56995 8.3533 0.146447ZM8.49951 14.7357C11.3753 13.3637 12.9774 11.1064 13.8739 9H8.49951V14.7357ZM14.2539 8C14.602 6.96614 14.7881 6.0206 14.8873 5.30622C14.9373 4.94634 14.9651 4.64633 14.9805 4.42476C12.1805 3.94759 10.0176 2.84358 8.49951 1.61873V8H14.2539ZM7.49951 1.6191C5.9814 2.84381 3.81873 3.94764 1.01898 4.42476C1.03441 4.64633 1.06219 4.94634 1.11217 5.30622C1.21139 6.0206 1.39746 6.96614 1.74556 8H7.49951V1.6191ZM2.12558 9C3.02201 11.1063 4.62399 13.3635 7.49951 14.7355V9H2.12558Z"
                ></path>
            </svg>
            {alt ? <span className="sr-only">{alt}</span> : null}
        </>
    );
};
