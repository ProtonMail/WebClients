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

export const IcRaw = ({ alt, title, size = 4, className = '', viewBox = '0 0 16 16', ...rest }: IconProps) => {
    return (
        <>
            {/* eslint-disable-next-line jsx-a11y/prefer-tag-over-role */}
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
                    d="M6.887 11.549V9.335h.576l2.149 2.537a.5.5 0 0 0 .763-.646L8.67 9.213c.142-.04.284-.094.42-.161.515-.253.985-.738.985-1.534 0-.792-.466-1.284-.974-1.55-.484-.253-1.04-.326-1.41-.323H6.388a.5.5 0 0 0-.5.5v5.404a.5.5 0 1 0 1 0ZM7.7 6.645c.259-.003.641.054.94.21.275.144.436.342.436.663 0 .318-.156.504-.426.637-.295.145-.676.19-.935.18h-.828v-1.69H7.7Z"
                ></path>
                <path
                    fillRule="evenodd"
                    d="M4 1a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V5.828a2 2 0 0 0-.586-1.414l-2.828-2.828A2 2 0 0 0 9.172 1H4Zm9 12V6h-2.5A1.5 1.5 0 0 1 9 4.5V2H4a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1ZM10 2.414 12.586 5H10.5a.5.5 0 0 1-.5-.5V2.414Z"
                ></path>
            </svg>
            {alt ? <span className="sr-only">{alt}</span> : null}
        </>
    );
};
