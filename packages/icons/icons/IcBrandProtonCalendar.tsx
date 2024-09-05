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

export const IcBrandProtonCalendar = ({
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
                    d="M15 4a2 2 0 0 0-2-2H3a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h7V9.5a.5.5 0 0 1 .5-.5H15V4Zm-2-1H3a1 1 0 0 0-1 1h7.5A2.5 2.5 0 0 1 12 6.5V8h2V4a1 1 0 0 0-1-1ZM9 13v-2.251l-.724 1.02a1.5 1.5 0 0 0-.276.868V13h1Zm-2 0v-.363a2.5 2.5 0 0 1 .46-1.446l1.821-2.568.001.001A1.498 1.498 0 0 1 10.5 8h.5V6.5A1.5 1.5 0 0 0 9.5 5H2v7a1 1 0 0 0 1 1h4Z"
                ></path>
                <path d="M11 11.99h.507a.388.388 0 0 0 .397.298c.23 0 .38-.126.38-.311s-.157-.288-.469-.288h-.202v-.417h.175c.301 0 .424-.111.424-.278 0-.166-.133-.28-.318-.28a.318.318 0 0 0-.336.29h-.486c.017-.29.246-.708.822-.708.462 0 .78.263.78.633a.559.559 0 0 1-.388.534v.007a.559.559 0 0 1 .459.569c0 .4-.367.665-.842.665-.506.002-.865-.286-.903-.714Z"></path>
                <path d="M14 10.334h-.37l-.565.383v.472l.459-.31v1.79H14v-2.335Z"></path>
            </svg>
            {alt ? <span className="sr-only">{alt}</span> : null}
        </>
    );
};
