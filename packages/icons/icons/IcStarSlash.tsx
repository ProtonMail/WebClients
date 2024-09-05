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

export const IcStarSlash = ({ alt, title, size = 4, className = '', viewBox = '0 0 16 16', ...rest }: IconProps) => {
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
                    d="m8 2.443-1.475 2.63a1.554 1.554 0 0 1-.42.48l5.088 5.3-.143-1.068a1.543 1.543 0 0 1 .425-1.28l2.06-2.118-2.973-.541a1.567 1.567 0 0 1-1.087-.773L8 2.443Zm4.364 9.631-.323-2.421a.542.542 0 0 1 .15-.45l2.653-2.728a.548.548 0 0 0-.308-.922l-3.795-.691a.567.567 0 0 1-.394-.278L8.498 1.288a.576.576 0 0 0-.996 0l-1.85 3.296a.561.561 0 0 1-.254.234L2.361 1.654a.5.5 0 0 0-.722.692l12 12.5a.5.5 0 0 0 .722-.692l-1.997-2.08ZM3.146 5.247l.83.865-1.51.275 2.06 2.119c.327.337.487.806.424 1.28l-.39 2.924 2.777-1.282c.42-.194.906-.194 1.326 0l.75.346 1.898 1.978-3.068-1.416a.582.582 0 0 0-.486 0l-3.489 1.61c-.406.187-.864-.137-.806-.57l.497-3.723a.542.542 0 0 0-.15-.45L1.155 6.475a.548.548 0 0 1 .308-.922l1.682-.306Z"
                ></path>
            </svg>
            {alt ? <span className="sr-only">{alt}</span> : null}
        </>
    );
};
