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

export const IcDiamond = ({ alt, title, size = 4, className = '', viewBox = '0 0 16 16', ...rest }: IconProps) => {
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

                <svg width="16" height="16" viewBox="0 0 16 16">
                    <path
                        fillRule="evenodd"
                        d="M14 2.5c0-.276-.5-1-.5-1s-.5.724-.5 1V3h-.5c-.276 0-1 .5-1 .5s.724.5 1 .5h.5v.5c0 .276.5 1 .5 1s.5-.724.5-1V4h.5c.276 0 1-.5 1-.5s-.724-.5-1-.5H14zM3.5 4a.5.5 0 0 0-.312.11l-2.5 2a.5.5 0 0 0-.064.72l7 8a.5.5 0 0 0 .752 0l7-8A.5.5 0 0 0 15 6H2.425l1.25-1H10.5a.5.5 0 0 0 0-1zm1.154 3H2.102l4.465 5.103zm9.244 0-4.465 5.103L11.347 7zM5.721 7h4.557L8 13.076z"
                    ></path>
                </svg>
            </svg>
            {alt ? <span className="sr-only">{alt}</span> : null}
        </>
    );
};
