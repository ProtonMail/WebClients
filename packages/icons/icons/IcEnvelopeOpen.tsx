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

export const IcEnvelopeOpen = ({ alt, title, size = 4, className = '', viewBox = '0 0 16 16', ...rest }: IconProps) => {
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
                    d="M14 8.195V11.8c0 .577 0 .949-.024 1.232-.022.272-.06.373-.085.422a1 1 0 0 1-.437.437c-.05.025-.15.063-.422.085C12.75 14 12.377 14 11.8 14H4.2c-.577 0-.949 0-1.232-.024-.272-.022-.373-.06-.422-.085a1 1 0 0 1-.437-.437c-.025-.05-.063-.15-.085-.422C2 12.75 2 12.377 2 11.8V8.195l5.213 3.218a1.497 1.497 0 0 0 1.574 0L14 8.195Zm-.004-1.173-5.735 3.54a.497.497 0 0 1-.522 0l-5.735-3.54a1.39 1.39 0 0 1 .032-.348 1 1 0 0 1 .157-.323c.062-.084.154-.167.645-.555l3.8-2.995c.365-.287.598-.47.787-.598.178-.12.262-.153.311-.166a1 1 0 0 1 .528 0c.05.013.133.046.311.166.19.128.422.31.787.598l3.8 2.995c.491.388.583.471.645.555a1 1 0 0 1 .156.323c.018.065.028.139.033.348ZM1 7.524c0-.57 0-.855.073-1.117a2 2 0 0 1 .314-.647c.16-.22.385-.396.832-.749l3.8-2.995c.708-.558 1.062-.837 1.453-.944a2 2 0 0 1 1.056 0c.391.107.745.386 1.453.944l3.8 2.995c.447.353.671.53.832.75.143.194.25.413.314.646.073.262.073.547.073 1.117V11.8c0 1.12 0 1.68-.218 2.108a2 2 0 0 1-.874.874C13.48 15 12.92 15 11.8 15H4.2c-1.12 0-1.68 0-2.108-.218a2 2 0 0 1-.874-.874C1 13.48 1 12.92 1 11.8V7.524Z"
                ></path>
            </svg>
            {alt ? <span className="sr-only">{alt}</span> : null}
        </>
    );
};
