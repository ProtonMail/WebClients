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

export const IcPassJson = ({ alt, title, size = 4, className = '', viewBox = '0 0 16 16', ...rest }: IconProps) => {
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
                    d="M8 0C3.58172 0 0 3.58172 0 8C0 12.4183 3.58172 16 8 16C12.4183 16 16 12.4183 16 8C16 3.58172 12.4183 0 8 0ZM1 8C1 4.13401 4.13401 1 8 1C8.42532 1 8.84178 1.03793 9.24618 1.1106C11.1943 2.01783 12.3758 4.095 12.3758 6.77498C12.3758 8.1092 11.9948 9.27757 11.3966 10.0995C10.8262 10.883 10.0765 11.334 9.26381 11.3723C9.55043 11.0989 9.8021 10.7887 10.0117 10.4486C10.4356 9.76075 10.6728 8.97423 10.6997 8.1667L10.7 8.15C10.7 7.12224 10.3554 6.01053 9.71351 5.14574C9.0661 4.27353 8.0911 3.625 6.84902 3.625C5.60507 3.625 4.53561 4.29422 3.79477 5.312C3.05553 6.32759 2.62402 7.70922 2.62402 9.225C2.62402 10.8994 3.04541 12.4218 3.8397 13.6301C2.11691 12.355 1 10.3079 1 8ZM6.75361 14.8894C7.15808 14.9621 7.57461 15 8 15C11.866 15 15 11.866 15 8C15 5.69194 13.883 3.64478 12.16 2.36965C12.9544 3.578 13.3758 5.10053 13.3758 6.77498C13.3758 8.29076 12.9443 9.67239 12.2051 10.688C11.4642 11.7058 10.3948 12.375 9.1508 12.375C7.90872 12.375 6.93373 11.7265 6.28632 10.8542C5.64442 9.98945 5.2998 8.87774 5.2998 7.84998L5.30008 7.83328C5.32706 7.02575 5.56422 6.23923 5.98813 5.55138C6.19773 5.21128 6.4494 4.90113 6.73602 4.62766C5.92333 4.66595 5.1736 5.11697 4.60327 5.9005C4.00501 6.72241 3.62402 7.89078 3.62402 9.225C3.62402 11.905 4.80554 13.9821 6.75361 14.8894ZM6.83945 6.07603C7.12906 5.6061 7.52103 5.20902 7.98488 4.9137C8.34186 5.1087 8.65222 5.39375 8.91054 5.74176C9.41742 6.42465 9.69812 7.32167 9.70001 8.14165C9.67749 8.77241 9.49157 9.38655 9.16038 9.92395C8.87077 10.3939 8.4788 10.791 8.01495 11.0863C7.65796 10.8913 7.3476 10.6062 7.08929 10.2582C6.58241 9.57533 6.30171 8.67831 6.29981 7.85833C6.32234 7.22758 6.50826 6.61343 6.83945 6.07603Z"
                ></path>
            </svg>
            {alt ? <span className="sr-only">{alt}</span> : null}
        </>
    );
};
