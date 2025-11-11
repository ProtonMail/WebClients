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

export const IcBrandProtonVpn = ({
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
                    d="M2.946 1.264C1.342 1.078.234 2.796.996 4.196l5.186 9.52a1.959 1.959 0 0 0 3.372.13l5.37-8.294c.796-1.228.043-2.891-1.422-3.061L2.946 1.264Zm-.941 2.382c-.332-.61.162-1.316.809-1.24L13.37 3.631c.597.07.935.765.59 1.296l-5.37 8.294a.81.81 0 0 1-1.4-.055l-.017-.033c.11-.07.21-.162.29-.276l.48-.68 3.857-5.43.003-.003c.598-.857-.011-1.93-.971-2.034l-8.767-.956-.06-.109Zm.729 1.338 3.868 7.102.403-.571.001-.002 3.856-5.427a.12.12 0 0 0 .01-.13c-.022-.045-.073-.093-.165-.103l-7.973-.87Zm3.907 7.174.031.057.018-.01a.116.116 0 0 0-.049-.047Z"
                ></path>
            </svg>
            {alt ? <span className="sr-only">{alt}</span> : null}
        </>
    );
};
