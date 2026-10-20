/*
 * This file is auto-generated. Do not modify it manually!
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

export const IcGlobe = ({ alt, title, size = 4, className = '', viewBox = '0 0 16 16', ...rest }: IconProps) => {
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
                    d="M7.121 2.064a6 6 0 0 1 .37-.043v5.48l-2.975.006c.123-1.986.991-3.937 2.605-5.443M3.514 7.509a9 9 0 0 1 1.741-4.846A6 6 0 0 0 2.02 7.512zM2.022 8.512l1.493-.003a9 9 0 0 0 1.741 4.828 6 6 0 0 1-3.234-4.825m2.494-.005L7.49 8.5v5.478a6 6 0 0 1-.368-.043c-1.61-1.502-2.479-3.448-2.606-5.43m3.974-.008v5.481q.211-.016.419-.048c1.61-1.505 2.477-3.455 2.6-5.438zm4.022-.007a9 9 0 0 1-1.727 4.824 6 6 0 0 0 3.195-4.827zm1.467-1.003-1.468.003a9 9 0 0 0-1.726-4.808A6 6 0 0 1 13.98 7.49m-2.47.005-3.019.005V2.02q.211.018.418.05c1.608 1.501 2.475 3.445 2.601 5.425M6.673 1.126l-.002-.003-.004.004a7.002 7.002 0 0 0 0 13.746l.004.003.002-.002a7 7 0 0 0 2.676-.004l.005.007.012-.01a7.002 7.002 0 0 0 0-13.734l-.012-.01-.005.007a7 7 0 0 0-2.676-.004"
                ></path>
            </svg>
            {alt ? <span className="sr-only">{alt}</span> : null}
        </>
    );
};
