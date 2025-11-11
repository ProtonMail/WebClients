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

export const IcHourglass = ({ alt, title, size = 4, className = '', viewBox = '0 0 16 16', ...rest }: IconProps) => {
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
                    d="M3.5 1a.5.5 0 1 0 0 1H4v1.322c0 .801 0 1.202.097 1.575a3 3 0 0 0 .42.927c.217.319.519.582 1.122 1.11l.254.222c.443.388.754.66 1.022.844-.268.184-.58.456-1.022.844l-.254.222c-.603.528-.905.791-1.121 1.11a2.999 2.999 0 0 0-.42.927C4 11.476 4 11.877 4 12.678V14h-.5a.5.5 0 0 0 0 1h9a.5.5 0 0 0 0-1H12v-1.322c0-.801 0-1.202-.098-1.575a2.996 2.996 0 0 0-.42-.927c-.216-.319-.518-.582-1.121-1.11l-.254-.222c-.443-.388-.754-.66-1.022-.844.268-.184.58-.456 1.022-.844l.254-.222c.603-.528.905-.791 1.121-1.11.192-.283.334-.596.42-.927C12 4.524 12 4.123 12 3.322V2h.5a.5.5 0 0 0 0-1h-9ZM11 14v-1.322c0-.854-.008-1.103-.065-1.322a1.998 1.998 0 0 0-.28-.618c-.128-.188-.31-.357-.953-.92l-.253-.222a15.933 15.933 0 0 0-.833-.702c-.191-.143-.281-.18-.332-.195a1 1 0 0 0-.568 0c-.05.015-.14.052-.332.195-.201.15-.448.366-.833.702l-.253.222c-.643.563-.825.732-.953.92a2 2 0 0 0-.28.618c-.057.22-.065.468-.065 1.322V14h6ZM5 3.322V2h6v1.322c0 .854-.008 1.103-.065 1.322-.058.22-.152.43-.28.618-.128.188-.31.357-.953.92l-.253.222c-.385.336-.632.551-.833.702-.191.143-.281.18-.332.195a1 1 0 0 1-.568 0c-.05-.015-.14-.052-.332-.195-.201-.15-.448-.366-.833-.702l-.253-.222c-.643-.563-.825-.732-.953-.92a2 2 0 0 1-.28-.618C5.008 4.424 5 4.176 5 3.322Z"
                ></path>
            </svg>
            {alt ? <span className="sr-only">{alt}</span> : null}
        </>
    );
};
