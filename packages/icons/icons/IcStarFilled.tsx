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

export const IcStarFilled = ({ alt, title, size = 4, className = '', viewBox = '0 0 16 16', ...rest }: IconProps) => {
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

                <path d="M7.502 1.788a.576.576 0 0 1 .996 0l1.85 3.296a.567.567 0 0 0 .393.278l3.795.69c.442.081.617.605.308.923l-2.652 2.728a.542.542 0 0 0-.15.45l.496 3.723c.058.433-.4.757-.806.57l-3.489-1.61a.582.582 0 0 0-.486 0l-3.489 1.61c-.406.187-.864-.137-.806-.57l.497-3.723a.542.542 0 0 0-.15-.45L1.155 6.975a.548.548 0 0 1 .308-.922l3.795-.691a.567.567 0 0 0 .394-.278l1.849-3.296Z"></path>
            </svg>
            {alt ? <span className="sr-only">{alt}</span> : null}
        </>
    );
};
