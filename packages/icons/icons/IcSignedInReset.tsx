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

export const IcSignedInReset = ({
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

                <path d="M8 1C9.38438 1 10.7376 1.41062 11.8887 2.17969C13.0398 2.94884 13.937 4.04223 14.4668 5.32129C14.9966 6.60027 15.1352 8.00747 14.8652 9.36523C14.5951 10.7231 13.9292 11.9712 12.9502 12.9502C11.9712 13.9292 10.7231 14.5951 9.36523 14.8652C8.00747 15.1352 6.60027 14.9966 5.32129 14.4668C4.04223 13.937 2.94884 13.0398 2.17969 11.8887C1.41062 10.7376 1 9.38438 1 8C1 7.72386 1.22386 7.5 1.5 7.5C1.77614 7.5 2 7.72386 2 8C2 9.18649 2.35166 10.3464 3.01074 11.333C3.67003 12.3197 4.60775 13.0888 5.7041 13.543C6.80044 13.9971 8.00704 14.1163 9.1709 13.8848C10.3347 13.6532 11.4032 13.0812 12.2422 12.2422C13.0812 11.4032 13.6532 10.3347 13.8848 9.1709C14.1163 8.00704 13.9971 6.80044 13.543 5.7041C13.0888 4.60775 12.3197 3.67003 11.333 3.01074C10.3467 2.35184 9.18713 2.00019 8.00098 2C6.3131 2.00583 4.69255 2.66423 3.47949 3.83789L2.76953 4.5H4.5C4.77614 4.5 5 4.72386 5 5C5 5.27614 4.77614 5.5 4.5 5.5H1.5C1.36739 5.5 1.24025 5.44728 1.14648 5.35352C1.05272 5.25975 1 5.13261 1 5V2C1 1.72386 1.22386 1.5 1.5 1.5C1.77614 1.5 2 1.72386 2 2V3.84961L2.78418 3.11914C4.18301 1.76575 6.05169 1.00659 7.99805 1H8ZM8.83301 10C8.83283 9.53995 8.46017 9.16699 8 9.16699C7.53991 9.16699 7.16717 9.53987 7.16699 10C7.16699 10.4602 7.5398 10.8339 8 10.834C8.46024 10.834 8.83301 10.4602 8.83301 10ZM9.83301 10C9.83301 11.0125 9.01252 11.834 8 11.834C6.98752 11.8339 6.16699 11.0125 6.16699 10C6.16714 9.16111 6.73077 8.45504 7.5 8.2373V4.66699C7.5 4.39085 7.72386 4.16699 8 4.16699C8.27614 4.16699 8.5 4.39085 8.5 4.66699V5.5H9.33301C9.60915 5.5 9.83301 5.72386 9.83301 6C9.83301 6.27614 9.60915 6.5 9.33301 6.5H8.5V8.2373C9.26923 8.45503 9.83286 9.16105 9.83301 10Z"></path>
            </svg>
            {alt ? <span className="sr-only">{alt}</span> : null}
        </>
    );
};
