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

export const IcPassLeaf = ({ alt, title, size = 4, className = '', viewBox = '0 0 16 16', ...rest }: IconProps) => {
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
                    d="M15.3543 0.64699C15.4685 0.761533 15.5203 0.924241 15.4932 1.0837L15.4919 1.09109L15.4884 1.11129L15.4748 1.18874C15.4628 1.25636 15.445 1.35534 15.4215 1.48191C15.3744 1.73501 15.3046 2.09858 15.213 2.54233C15.03 3.42927 14.7596 4.63916 14.4106 5.92875C14.0621 7.21665 13.6325 8.59359 13.1294 9.81113C12.6318 11.0153 12.0408 12.1178 11.3478 12.8106C9.2137 14.9447 5.82422 15.0576 3.55814 13.149L1.35355 15.3536C1.15829 15.5488 0.841709 15.5488 0.646447 15.3536C0.451184 15.1583 0.451184 14.8417 0.646447 14.6465L2.85121 12.4417C0.944301 10.1755 1.05642 6.78749 3.18795 4.65418C3.87565 3.95361 4.97604 3.35942 6.17836 2.86097C7.39531 2.35645 8.77348 1.92753 10.0631 1.58044C11.3544 1.23288 12.5668 0.964772 13.4557 0.783608C13.9005 0.692969 14.2649 0.623955 14.5187 0.57752C14.6456 0.5543 14.7449 0.536719 14.8127 0.524895L14.8904 0.511491L14.9106 0.508054L14.918 0.506809C15.0776 0.480219 15.2401 0.532447 15.3543 0.64699ZM10.6407 12.1035C8.89727 13.8469 6.14078 13.9585 4.26844 12.4387L7.85355 8.85356C8.04882 8.6583 8.04882 8.34172 7.85355 8.14645C7.65829 7.95119 7.34171 7.95119 7.14645 8.14645L3.56154 11.7314C2.04265 9.85809 2.15455 7.10184 3.89681 5.35958L3.90028 5.35603C4.44108 4.80439 5.38616 4.27192 6.56132 3.78473C7.72288 3.30318 9.05541 2.88723 10.323 2.54607C11.5888 2.20539 12.78 1.94187 13.6554 1.76347C13.9298 1.70754 14.173 1.66003 14.3773 1.62118C14.338 1.82479 14.29 2.06693 14.2337 2.34022C14.0534 3.21381 13.7876 4.40298 13.4454 5.66751C13.1027 6.93374 12.6859 8.26598 12.2052 9.42922C11.719 10.6058 11.1887 11.5557 10.6407 12.1035Z"
                ></path>
            </svg>
            {alt ? <span className="sr-only">{alt}</span> : null}
        </>
    );
};
