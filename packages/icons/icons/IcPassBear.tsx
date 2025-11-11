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

export const IcPassBear = ({ alt, title, size = 4, className = '', viewBox = '0 0 16 16', ...rest }: IconProps) => {
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

                <path d="M6 9C6.55228 9 7 8.55228 7 8C7 7.44772 6.55228 7 6 7C5.44772 7 5 7.44772 5 8C5 8.55228 5.44772 9 6 9Z"></path>
                <path d="M11 8C11 8.55228 10.5523 9 10 9C9.44771 9 9 8.55228 9 8C9 7.44772 9.44771 7 10 7C10.5523 7 11 7.44772 11 8Z"></path>
                <path d="M6.5 12C6.22386 12 6 12.2239 6 12.5C6 12.7761 6.22386 13 6.5 13H9.5C9.77614 13 10 12.7761 10 12.5C10 12.2239 9.77614 12 9.5 12H8L10 10H6L8 12H6.5Z"></path>
                <path
                    fillRule="evenodd"
                    clipRule="evenodd"
                    d="M0 3.5C0 1.56686 1.56686 0 3.5 0C4.94441 0 6.16997 0.877933 6.70361 2.11981C7.12372 2.04114 7.55706 2 8 2C8.44288 2 8.87616 2.04113 9.29621 2.11978C9.82985 0.877916 11.0554 0 12.4998 0C14.4329 0 15.9998 1.56686 15.9998 3.5C15.9998 4.69579 15.3954 5.73799 14.4876 6.36624C14.818 7.17924 15 8.06837 15 9C15 12.866 11.866 16 8 16C4.13401 16 1 12.866 1 9C1 8.06841 1.18198 7.17932 1.51234 6.36635C0.604465 5.73811 0 4.69585 0 3.5ZM13.3631 6.30688C13.3717 6.33668 13.3832 6.36611 13.3977 6.39479C13.4096 6.4183 13.4231 6.44046 13.438 6.46121C13.7986 7.23224 14 8.0926 14 9C14 12.3137 11.3137 15 8 15C4.68629 15 2 12.3137 2 9C2 8.09228 2.20157 7.23164 2.56239 6.4604C2.57707 6.43988 2.59037 6.41799 2.60211 6.39479C2.61648 6.3664 2.62789 6.33729 2.63644 6.30781C3.39351 4.80248 4.76565 3.6597 6.42294 3.20941C6.45321 3.20689 6.48368 3.20156 6.51404 3.19325C6.53902 3.18641 6.56303 3.1778 6.58598 3.16758C7.0394 3.05804 7.51292 3 8 3C8.48692 3 8.9603 3.058 9.4136 3.16748C9.43662 3.17774 9.4607 3.18639 9.48576 3.19325C9.51621 3.20159 9.54678 3.20692 9.57715 3.20943C11.2341 3.65965 12.6059 4.80204 13.3631 6.30688ZM14.038 5.45629C14.624 4.99889 14.9998 4.29432 14.9998 3.5C14.9998 2.11914 13.8807 1 12.4998 1C11.5272 1 10.6881 1.56064 10.2779 2.37898C11.8677 2.92582 13.1986 4.02914 14.038 5.45629ZM3.5 1C4.47263 1 5.3117 1.56067 5.72195 2.37904C4.13217 2.92592 2.80127 4.02925 1.96191 5.4564C1.37582 4.99901 1 4.29438 1 3.5C1 2.11914 2.11914 1 3.5 1Z"
                ></path>
            </svg>
            {alt ? <span className="sr-only">{alt}</span> : null}
        </>
    );
};
