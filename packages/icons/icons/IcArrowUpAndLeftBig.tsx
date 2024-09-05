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

export const IcArrowUpAndLeftBig = ({
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
                    d="M7.687 2.042a.5.5 0 0 0-.54.09l-5.985 5.5a.5.5 0 0 0 0 .736l5.986 5.5a.5.5 0 0 0 .838-.368v-3.02c1.073.011 3.864.345 6.067 3.298a.512.512 0 0 0 .758.07.507.507 0 0 0 .158-.325c.017-.173.09-1.109-.073-2.255-.161-1.137-.565-2.549-1.558-3.61-.895-.956-2.123-1.48-3.19-1.77a11.566 11.566 0 0 0-2.162-.366V2.5a.5.5 0 0 0-.3-.458Zm-.701 1.596V5.8c0 .381.302.689.676.705.37.016 1.249.082 2.224.348.981.268 2.007.725 2.722 1.489.79.844 1.15 2.018 1.298 3.067.038.263.061.514.075.744C11.4 9.494 8.428 9.447 7.636 9.487a.687.687 0 0 0-.65.69v2.185L2.239 8l4.747-4.362Z"
                ></path>
            </svg>
            {alt ? <span className="sr-only">{alt}</span> : null}
        </>
    );
};
