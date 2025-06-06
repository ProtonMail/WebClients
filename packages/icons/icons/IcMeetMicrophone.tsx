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

export const IcMeetMicrophone = ({
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

                <path
                    d="M9.33301 2.66699C9.33301 2.31337 9.19243 1.97466 8.94238 1.72461C8.72359 1.50582 8.43706 1.37015 8.13184 1.33984L8 1.33398C7.64638 1.33398 7.30767 1.47456 7.05762 1.72461C6.80757 1.97466 6.66699 2.31337 6.66699 2.66699V8C6.66699 8.35362 6.80757 8.69331 7.05762 8.94336C7.30763 9.1932 7.64653 9.33398 8 9.33398C8.35347 9.33398 8.69237 9.1932 8.94238 8.94336C9.19243 8.69331 9.33301 8.35362 9.33301 8V2.66699ZM10.667 8C10.667 8.70717 10.3857 9.38566 9.88574 9.88574C9.38564 10.3858 8.70724 10.667 8 10.667C7.29276 10.667 6.61436 10.3858 6.11426 9.88574C5.61426 9.38566 5.33301 8.70717 5.33301 8V2.66699C5.33301 1.95975 5.61416 1.28135 6.11426 0.78125C6.61435 0.281153 7.29276 1.57833e-08 8 0L8.26367 0.0136719C8.87408 0.074311 9.44819 0.343697 9.88574 0.78125C10.3858 1.28135 10.667 1.95975 10.667 2.66699V8Z"
                    fill="currentColor"
                ></path>
                <path
                    d="M2.66626 8V6.66699C2.66626 6.2988 2.96506 6 3.33325 6C3.70144 6 4.00024 6.2988 4.00024 6.66699V8L4.00513 8.19824C4.05408 9.18705 4.46778 10.1257 5.17114 10.8291C5.92129 11.5792 6.93938 12 8.00024 12L8.19849 11.9951C9.18697 11.946 10.1252 11.5322 10.8284 10.8291C11.5317 10.1257 11.9464 9.18706 11.9954 8.19824L12.0002 8V6.66699C12.0002 6.29891 12.2982 6.00018 12.6663 6C13.0344 6 13.3333 6.2988 13.3333 6.66699V8L13.3264 8.26465C13.261 9.5829 12.7085 10.8338 11.7708 11.7715C10.833 12.7092 9.58221 13.2619 8.26392 13.3271L8.00024 13.334C6.58576 13.334 5.22895 12.7717 4.22876 11.7715C3.29104 10.8338 2.73846 9.5829 2.6731 8.26465L2.66626 8Z"
                    fill="currentColor"
                ></path>
                <path
                    d="M7.33301 15.334V12.667C7.33301 12.2988 7.63181 12 8 12C8.36819 12 8.66699 12.2988 8.66699 12.667V15.334C8.66682 15.702 8.36808 16 8 16C7.63192 16 7.33318 15.702 7.33301 15.334Z"
                    fill="currentColor"
                ></path>
                <path
                    d="M10.6663 14.666L10.801 14.6797C11.1048 14.7419 11.3333 15.0109 11.3333 15.333C11.3333 15.6552 11.1048 15.9241 10.801 15.9863L10.6663 16H5.33325C4.96506 16 4.66626 15.7012 4.66626 15.333C4.66626 14.9648 4.96506 14.666 5.33325 14.666H10.6663Z"
                    fill="currentColor"
                ></path>
            </svg>
            {alt ? <span className="sr-only">{alt}</span> : null}
        </>
    );
};
