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

export const IcMeetSpeaker = ({ alt, title, size = 4, className = '', viewBox = '0 0 16 16', ...rest }: IconProps) => {
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
                    d="M9.15137 1.59822C9.34059 1.48209 9.57832 1.4671 9.7832 1.56306C10.0172 1.67287 10.167 1.90806 10.167 2.16658V14.1666C10.167 14.4251 10.0172 14.6603 9.7832 14.7701C9.54895 14.8798 9.27196 14.8439 9.07324 14.6783L5.25879 11.4996H2.83301C1.72859 11.4994 0.833008 10.6041 0.833008 9.49959V6.83357C0.833008 5.72911 1.72859 4.83375 2.83301 4.83357H5.25879L9.07324 1.65486L9.15137 1.59822ZM2.16699 9.49959C2.16699 9.86768 2.46496 10.1664 2.83301 10.1666H5.5L5.61523 10.1763C5.72923 10.1963 5.83681 10.246 5.92676 10.3209L8.83301 12.7428V3.58943L5.92676 6.01228C5.80697 6.11206 5.6559 6.16658 5.5 6.16658H2.83301C2.46497 6.16676 2.16699 6.46549 2.16699 6.83357V9.49959Z"
                    fill="currentColor"
                ></path>
                <path
                    d="M12.1664 8.16777C12.1664 7.5234 11.9387 6.93273 11.558 6.47148L11.3852 6.28203L11.3002 6.17754C11.1291 5.91874 11.1573 5.56657 11.3852 5.33867C11.6131 5.11077 11.9652 5.0826 12.224 5.25371L12.3285 5.33867L12.4604 5.47734C13.1056 6.18721 13.4994 7.13224 13.4994 8.16777C13.4993 9.2031 13.1055 10.1475 12.4604 10.8572L12.3285 10.9959C12.0682 11.2562 11.6455 11.2562 11.3852 10.9959C11.1249 10.7355 11.1248 10.3129 11.3852 10.0525L11.558 9.86308C11.9386 9.40195 12.1663 8.81194 12.1664 8.16777Z"
                    fill="currentColor"
                ></path>
                <path
                    d="M14.8334 8.16581C14.8333 6.78494 14.3091 5.52746 13.4477 4.57988L13.2709 4.39531L13.186 4.29081C13.0149 4.03201 13.043 3.67985 13.2709 3.45195C13.4988 3.22405 13.851 3.19589 14.1098 3.36699L14.2143 3.45195L14.435 3.68339C15.5104 4.86669 16.1663 6.44029 16.1664 8.16581C16.1664 9.89155 15.5105 11.4658 14.435 12.6492L14.2143 12.8807C13.954 13.141 13.5313 13.141 13.2709 12.8807C13.0106 12.6203 13.0106 12.1977 13.2709 11.9373L13.4477 11.7518C14.309 10.8041 14.8334 9.54664 14.8334 8.16581Z"
                    fill="currentColor"
                ></path>
            </svg>
            {alt ? <span className="sr-only">{alt}</span> : null}
        </>
    );
};
