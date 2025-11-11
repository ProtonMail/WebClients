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

export const IcBrandVisa = ({ alt, title, size = 4, className = '', viewBox = '0 0 16 16', ...rest }: IconProps) => {
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
                    d="M13 4H3a1 1 0 0 0-1 1v6a1 1 0 0 0 1 1h10a1 1 0 0 0 1-1V5a1 1 0 0 0-1-1ZM3 3a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2H3Z"
                ></path>
                <path d="M9.439 6.299c-.745 0-1.412.386-1.412 1.1 0 .819 1.182.876 1.182 1.287 0 .173-.199.328-.538.328-.48 0-.84-.217-.84-.217l-.154.72s.414.184.964.184c.815 0 1.457-.405 1.457-1.132 0-.865-1.187-.92-1.187-1.301 0-.136.163-.285.501-.285.381 0 .692.158.692.158l.151-.696s-.338-.146-.816-.146Zm-6.82.052-.019.105s.314.058.596.172c.364.132.39.208.451.445l.668 2.574h.894L6.588 6.35h-.893l-.886 2.24-.361-1.898c-.033-.218-.201-.342-.407-.342H2.618Zm4.328 0-.7 3.296h.851l.698-3.296h-.849Zm4.748 0c-.205 0-.314.11-.394.302l-1.247 2.994h.893l.173-.5h1.087l.105.5h.788l-.687-3.296h-.718Zm.116.89.265 1.237h-.709l.444-1.236Z"></path>
            </svg>
            {alt ? <span className="sr-only">{alt}</span> : null}
        </>
    );
};
