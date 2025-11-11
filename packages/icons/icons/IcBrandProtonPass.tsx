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

export const IcBrandProtonPass = ({
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
                    fillRule="evenodd"
                    d="M13.5758 6.97493L9.02554 2.42469C8.45928 1.85843 7.54119 1.85843 6.97493 2.4247L2.42469 6.97493C1.85843 7.54119 1.85843 8.45928 2.4247 9.02554L6.97493 13.5758C7.54119 14.142 8.45928 14.142 9.02554 13.5758L13.5758 9.02554C14.142 8.45928 14.142 7.54119 13.5758 6.97493ZM9.73264 1.71759C8.77586 0.760803 7.2246 0.760805 6.26782 1.71759L1.71759 6.26782C0.760803 7.2246 0.760805 8.77586 1.71759 9.73264L6.26782 14.2829C7.2246 15.2397 8.77586 15.2397 9.73264 14.2829L14.2829 9.73264C15.2397 8.77586 15.2397 7.2246 14.2829 6.26782L9.73264 1.71759Z"
                ></path>
                <path
                    fillRule="evenodd"
                    d="M10.8492 7.62815L5.85161 2.6306L6.55871 1.92349L11.5563 6.92104C12.142 7.50683 12.142 8.45657 11.5563 9.04236L6.50735 14.0913L5.80025 13.3842L10.8492 8.33525C11.0444 8.13999 11.0444 7.82341 10.8492 7.62815Z"
                ></path>
            </svg>
            {alt ? <span className="sr-only">{alt}</span> : null}
        </>
    );
};
