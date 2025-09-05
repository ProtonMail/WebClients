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

export const IcMeetScreenShare = ({
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

                <path d="M8.83374 11.5V14.167H7.49976V11.5H8.83374Z" fill="currentColor"></path>
                <path d="M12.1663 13.5V14.834H4.16626V13.5H12.1663Z" fill="currentColor"></path>
                <path
                    d="M0.833008 10.166V4.16602C0.833184 3.0617 1.7287 2.16619 2.83301 2.16602H4.16699V3.5H2.83301C2.46508 3.50018 2.16717 3.79808 2.16699 4.16602V10.166C2.16699 10.5341 2.46496 10.8328 2.83301 10.833H13.5C13.8682 10.833 14.167 10.5342 14.167 10.166V4.16602C14.1668 3.79797 13.8681 3.5 13.5 3.5H12.167V2.16602H13.5C14.6045 2.16602 15.4998 3.0616 15.5 4.16602V10.166C15.5 11.2706 14.6046 12.166 13.5 12.166H2.83301C1.72859 12.1658 0.833008 11.2705 0.833008 10.166Z"
                    fill="currentColor"
                ></path>
                <path d="M7.49976 1.83301H8.83374V8.16602H7.49976V1.83301Z" fill="currentColor"></path>
                <path
                    d="M5.80981 5.13281L5.33813 5.60449L4.39575 4.66113L4.86646 4.19043L5.80981 5.13281ZM8.63794 1.36133L11.4661 4.19043L11.9377 4.66113L10.9954 5.60449L8.16626 2.77539L5.80981 5.13281L5.33813 4.66113L4.86646 4.19043L8.16626 0.890625L8.63794 1.36133Z"
                    fill="currentColor"
                ></path>
            </svg>
            {alt ? <span className="sr-only">{alt}</span> : null}
        </>
    );
};
