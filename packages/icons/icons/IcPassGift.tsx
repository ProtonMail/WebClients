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

export const IcPassGift = ({ alt, title, size = 4, className = '', viewBox = '0 0 16 16', ...rest }: IconProps) => {
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
                    d="M4.33324 0C4.32567 0 4.31809 0.000172198 4.31052 0.000516444C3.67044 0.0296318 3.06797 0.311202 2.63504 0.783571C2.20684 1.25079 1.97901 1.86701 1.99989 2.49987C1.98182 3.03927 2.1445 3.56666 2.45802 4H0.5C0.223858 4 0 4.22386 0 4.5V7.5C0 7.77614 0.223858 8 0.5 8H15.5C15.7761 8 16 7.77614 16 7.5V4.5C16 4.22386 15.7761 4 15.5 4H13.5422C13.8557 3.56666 14.0184 3.03927 14.0004 2.49987C14.0212 1.86701 13.7934 1.25079 13.3652 0.783571C12.9323 0.311202 12.3298 0.0296318 11.6897 0.000516444C11.6822 0.000172198 11.6746 0 11.667 0C10.0329 0 8.98607 1.20702 8.38357 2.24987C8.23479 2.50738 8.10755 2.76388 8.00012 3.00465C7.8927 2.76388 7.76545 2.50738 7.61668 2.24987C7.01418 1.20702 5.96734 0 4.33324 0ZM7.32247 4H4.34532C3.97339 3.98055 3.62379 3.81582 3.37195 3.54105C3.11778 3.26372 2.98395 2.89692 2.9998 2.52107C3.00039 2.50711 3.00039 2.49314 2.99981 2.47919C2.98415 2.10332 3.11808 1.73657 3.37226 1.45923C3.62394 1.18462 3.97321 1.01984 4.34488 1.00003C5.41681 1.00572 6.1998 1.79642 6.75081 2.75013C7.00946 3.19782 7.19714 3.6495 7.32247 4ZM11.6549 4H8.67778C8.8031 3.6495 8.99079 3.19782 9.24944 2.75013C9.80045 1.79642 10.5834 1.00572 11.6554 1.00003C12.027 1.01984 12.3763 1.18462 12.628 1.45923C12.8822 1.73657 13.0161 2.10332 13.0004 2.47919C12.9999 2.49314 12.9999 2.50711 13.0004 2.52107C13.0163 2.89692 12.8825 3.26372 12.6283 3.54105C12.3765 3.81582 12.0269 3.98055 11.6549 4ZM15 5V7H1V5H15Z"
                ></path>
                <path d="M3 9.5C3 9.22386 2.77614 9 2.5 9C2.22386 9 2 9.22386 2 9.5V14C2 14.5304 2.21071 15.0391 2.58579 15.4142C2.96086 15.7893 3.46957 16 4 16H12C12.5304 16 13.0391 15.7893 13.4142 15.4142C13.7893 15.0391 14 14.5304 14 14V9.5C14 9.22386 13.7761 9 13.5 9C13.2239 9 13 9.22386 13 9.5V14C13 14.2652 12.8946 14.5196 12.7071 14.7071C12.5196 14.8946 12.2652 15 12 15H4C3.73478 15 3.48043 14.8946 3.29289 14.7071C3.10536 14.5196 3 14.2652 3 14V9.5Z"></path>
            </svg>
            {alt ? <span className="sr-only">{alt}</span> : null}
        </>
    );
};
