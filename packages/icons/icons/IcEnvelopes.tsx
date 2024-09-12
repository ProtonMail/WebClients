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

export const IcEnvelopes = ({ alt, title, size = 4, className = '', viewBox = '0 0 16 16', ...rest }: IconProps) => {
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
                    d="M4.2 2h7.6c.577 0 .949 0 1.232.024.272.022.373.06.422.085a1 1 0 0 1 .437.437c.025.05.063.15.085.422.007.088.012.186.016.295a2.012 2.012 0 0 0-.084-.045C13.48 3 12.92 3 11.8 3H4.2c-1.12 0-1.68 0-2.108.218a2 2 0 0 0-.084.045c.004-.11.009-.207.016-.295.022-.272.06-.373.085-.422a1 1 0 0 1 .437-.437c.05-.025.15-.063.422-.085C3.25 2 3.623 2 4.2 2ZM2 8.217V11.8c0 .577 0 .949.024 1.232.022.272.06.373.085.422a1 1 0 0 0 .437.437c.05.025.15.063.422.085C3.25 14 3.623 14 4.2 14h7.6c.577 0 .949 0 1.232-.024.272-.022.373-.06.422-.085a1 1 0 0 0 .437-.437c.024-.046.058-.138.08-.373l.005-.049C14 12.75 14 12.377 14 11.8V8.217l-5.214 3.209a1.5 1.5 0 0 1-1.572 0L2 8.217ZM1 6.2v-2c0-1.12 0-1.68.218-2.108a2 2 0 0 1 .874-.874C2.52 1 3.08 1 4.2 1h7.6c1.12 0 1.68 0 2.108.218a2 2 0 0 1 .874.874C15 2.52 15 3.08 15 4.2v7.6c0 1.12 0 1.68-.218 2.108a2 2 0 0 1-.874.874C13.48 15 12.92 15 11.8 15H4.2c-1.12 0-1.68 0-2.108-.218a2 2 0 0 1-.874-.874C1 13.48 1 12.92 1 11.8V6.2ZM11.8 4H4.2c-.577 0-.949 0-1.232.024-.272.022-.373.06-.422.085a1 1 0 0 0-.437.437c-.025.05-.063.15-.085.422a6.034 6.034 0 0 0-.016.295 2 2 0 0 1 .084-.045C2.52 5 3.08 5 4.2 5h7.6c1.12 0 1.68 0 2.108.218l.084.045a6.048 6.048 0 0 0-.016-.295c-.022-.272-.06-.373-.085-.422a1 1 0 0 0-.437-.437c-.05-.025-.15-.063-.422-.085C12.75 4 12.377 4 11.8 4Zm2.182 3.054-5.72 3.52a.5.5 0 0 1-.524 0l-5.72-3.52.006-.086c.022-.272.06-.373.085-.422a1 1 0 0 1 .437-.437c.05-.025.15-.063.422-.085C3.25 6 3.623 6 4.2 6h7.6c.577 0 .949 0 1.232.024.272.022.373.06.422.085a1 1 0 0 1 .437.437c.025.05.063.15.085.422l.006.086Z"
                ></path>
            </svg>
            {alt ? <span className="sr-only">{alt}</span> : null}
        </>
    );
};
