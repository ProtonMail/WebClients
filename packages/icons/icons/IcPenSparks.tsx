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

export const IcPenSparks = ({ alt, title, size = 4, className = '', viewBox = '0 0 16 16', ...rest }: IconProps) => {
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
                    d="m12.315 4.841 1.435 1.493 1.07-1.107a.033.033 0 0 0 0-.046l-1.39-1.438a.035.035 0 0 0-.011-.008.041.041 0 0 0-.016-.003.041.041 0 0 0-.016.003.034.034 0 0 0-.012.008l-1.06 1.098Zm-.67.693-6.53 6.764a1.063 1.063 0 0 0-.28.552l-.276 1.55 1.468-.314a1.01 1.01 0 0 0 .515-.287l6.54-6.772-1.436-1.493Zm2.452-2.486a.958.958 0 0 0-1.388 0l-8.26 8.554a2.054 2.054 0 0 0-.543 1.07l-.398 2.241c-.063.355.241.663.582.59l2.127-.455c.376-.08.72-.273.991-.553l8.277-8.572a1.042 1.042 0 0 0 0-1.438l-1.388-1.437Z"
                    clipRule="evenodd"
                ></path>
                <path d="m7.27.536-.402.938a.75.75 0 0 1-.394.394l-.938.402a.25.25 0 0 0 0 .46l.938.402a.75.75 0 0 1 .394.394l.402.938a.25.25 0 0 0 .46 0l.402-.938a.75.75 0 0 1 .394-.394l.938-.402a.25.25 0 0 0 0-.46l-.938-.402a.75.75 0 0 1-.394-.394L7.73.536a.25.25 0 0 0-.46 0ZM3.268 3.58l-.609 1.522a1 1 0 0 1-.557.557L.58 6.268a.25.25 0 0 0 0 .464l1.522.609a1 1 0 0 1 .557.557l.609 1.522c.084.21.38.21.464 0l.609-1.522a1 1 0 0 1 .557-.557l1.522-.609a.25.25 0 0 0 0-.464l-1.522-.609a1 1 0 0 1-.557-.557L3.732 3.58a.25.25 0 0 0-.464 0Z"></path>
            </svg>
            {alt ? <span className="sr-only">{alt}</span> : null}
        </>
    );
};
