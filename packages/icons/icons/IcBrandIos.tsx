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

export const IcBrandIos = ({ alt, title, size = 4, className = '', viewBox = '0 0 16 16', ...rest }: IconProps) => {
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

                <path d="M44 5H20C11.7157 5 5 11.7157 5 20V44C5 52.2843 11.7157 59 20 59H44C52.2843 59 59 52.2843 59 44V20C59 11.7157 52.2843 5 44 5ZM20 4C11.1634 4 4 11.1634 4 20V44C4 52.8366 11.1634 60 20 60H44C52.8366 60 60 52.8366 60 44V20C60 11.1634 52.8366 4 44 4H20Z"></path>
                <path d="M12.186 41.5278H15.4937V27.4466H12.186V41.5278ZM13.8332 25.6C14.8694 25.6 15.6797 24.8029 15.6797 23.8067C15.6797 22.797 14.8694 22 13.8332 22C12.8103 22 12 22.7971 12 23.8067C12 24.803 12.8103 25.6 13.8332 25.6ZM26.5068 22.0398C20.9143 22.0398 17.4071 25.8524 17.4071 31.9499C17.4071 38.0475 20.9139 41.8468 26.5068 41.8468C32.0861 41.8468 35.5933 38.0475 35.5933 31.9499C35.5933 25.8524 32.0865 22.0398 26.5068 22.0398ZM26.5068 24.9623C29.9209 24.9623 32.0994 27.6723 32.0994 31.9499C32.0994 36.2141 29.9208 38.9241 26.5068 38.9241C23.0796 38.9241 20.9143 36.2141 20.9143 31.9499C20.9143 27.6724 23.0796 24.9623 26.5068 24.9623ZM36.9887 36.1345C37.1348 39.6682 40.0308 41.8468 44.4411 41.8468C49.0774 41.8468 52 39.5619 52 35.9219C52 33.0659 50.3527 31.4584 46.4605 30.5685L44.2553 30.0637C41.904 29.5057 40.9342 28.7618 40.9342 27.4865C40.9342 25.8924 42.3955 24.8297 44.5608 24.8297C46.7527 24.8297 48.2537 25.9057 48.4132 27.6991H51.6811C51.6014 24.3249 48.8117 22.0399 44.5875 22.0399C40.4161 22.0399 37.4537 24.338 37.4537 27.7389C37.4537 30.4754 39.1275 32.1758 42.661 32.9862L45.1451 33.5708C47.5629 34.142 48.5459 34.939 48.5459 36.3206C48.5459 37.9147 46.9385 39.0571 44.6272 39.0571C42.2891 39.0571 40.5225 37.9014 40.3099 36.1346L36.9887 36.1345Z"></path>
            </svg>
            {alt ? <span className="sr-only">{alt}</span> : null}
        </>
    );
};
