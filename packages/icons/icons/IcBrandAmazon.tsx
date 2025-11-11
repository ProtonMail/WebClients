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

export const IcBrandAmazon = ({ alt, title, size = 4, className = '', viewBox = '0 0 16 16', ...rest }: IconProps) => {
    return (
        <>
            {/* eslint-disable-next-line jsx-a11y/prefer-tag-over-role */}
            <svg
                viewBox={viewBox}
                className={`icon-size-${size} ${className}`}
                role="img"
                focusable="false"
                aria-hidden="true"
                {...rest}
            >
                {title ? <title>{title}</title> : null}

                <path d="M10.4168 9.74686C9.67878 10.8262 8.59812 11.3362 7.33345 11.3362C5.79745 11.3362 4.48278 10.1542 4.67145 8.58686C4.88145 6.8482 6.23145 6.1002 8.47678 5.82486C8.87745 5.7762 9.04345 5.7622 9.90812 5.6982L10.0001 5.69153V5.54819C10.0001 4.35086 9.28812 3.53353 8.33345 3.53353C7.37545 3.53353 6.70678 4.03153 6.29678 5.21753L5.03678 4.78286C5.62812 3.06953 6.79545 2.2002 8.33345 2.2002C10.0688 2.2002 11.3335 3.65219 11.3335 5.54819C11.3335 7.3142 11.4421 8.71886 11.6555 9.25286C11.8928 9.84753 11.9795 9.99753 12.2448 10.3282L11.2048 11.1622C10.8561 10.7275 10.7028 10.4629 10.4175 9.74753V9.74686H10.4168ZM14.1715 13.6969C13.9908 13.8302 13.6768 13.7509 13.8188 13.4035C13.9955 12.9715 14.1835 12.4649 13.9935 12.2355C13.8535 12.0655 13.6821 11.9809 13.3088 11.9809C13.0021 11.9809 12.8488 12.0209 12.6455 12.0342C12.5095 12.0429 12.4501 11.8362 12.5848 11.7409C12.7611 11.6145 12.9571 11.5181 13.1648 11.4555C13.9315 11.2262 14.8348 11.3522 14.9448 11.5109C15.1881 11.8642 14.8121 13.2229 14.1715 13.6969ZM13.3835 12.9742C13.2103 13.1417 13.0254 13.2965 12.8301 13.4375C11.4155 14.5149 9.58345 15.0775 7.99145 15.0775C5.42945 15.0775 3.13812 13.8822 1.39945 11.8809C1.25078 11.7275 1.37412 11.5035 1.54812 11.6249C3.42145 13.0095 5.74012 13.8469 8.14078 13.8469C9.65078 13.8469 11.2795 13.4889 12.8308 12.7182C12.9388 12.6675 13.0601 12.5982 13.1661 12.5489C13.4108 12.4089 13.6261 12.7529 13.3835 12.9742ZM10.0068 7.02753C9.16812 7.0902 9.00945 7.10286 8.63878 7.1482C6.93745 7.35686 6.10745 7.81686 5.99545 8.74686C5.91145 9.4422 6.53545 10.0029 7.33345 10.0029C8.69278 10.0029 9.67812 9.1842 10.0148 7.02753H10.0068Z"></path>
            </svg>
            {alt ? <span className="sr-only">{alt}</span> : null}
        </>
    );
};
