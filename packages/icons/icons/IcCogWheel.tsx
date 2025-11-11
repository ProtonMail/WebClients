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

export const IcCogWheel = ({ alt, title, size = 4, className = '', viewBox = '0 0 16 16', ...rest }: IconProps) => {
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
                    d="m1.28 9.377 1.117.354a.706.706 0 0 1 .432.407c.08.193.08.411-.017.596l-.543 1.044a.4.4 0 0 0 .072.467l1.412 1.413a.4.4 0 0 0 .467.072l1.043-.543a.703.703 0 0 1 .596-.017c.19.08.343.234.406.431l.354 1.12a.4.4 0 0 0 .382.279h1.99a.4.4 0 0 0 .38-.28l.355-1.119a.704.704 0 0 1 .406-.43c.193-.081.411-.08.596.016l1.043.543a.4.4 0 0 0 .468-.072l1.411-1.412a.4.4 0 0 0 .072-.468l-.544-1.046a.699.699 0 0 1-.016-.592.7.7 0 0 1 .432-.405l1.124-.348A.4.4 0 0 0 15 9.005V7.013a.4.4 0 0 0-.28-.381l-1.117-.355a.706.706 0 0 1-.432-.406.704.704 0 0 1 .017-.596l.543-1.044a.4.4 0 0 0-.072-.468l-1.412-1.412a.4.4 0 0 0-.467-.072l-1.044.543a.701.701 0 0 1-.595.017.703.703 0 0 1-.405-.432L9.381 1.28A.4.4 0 0 0 8.999 1H7.01a.4.4 0 0 0-.38.28l-.355 1.119a.704.704 0 0 1-.406.43.703.703 0 0 1-.596-.016L4.229 2.27a.4.4 0 0 0-.467.071l-1.42 1.412a.4.4 0 0 0-.073.469l.543 1.044a.704.704 0 0 1 .017.596.706.706 0 0 1-.432.407l-1.118.354A.4.4 0 0 0 1 7.005v1.99a.4.4 0 0 0 .28.382ZM14 7.452l-.7-.221a1.705 1.705 0 0 1-1.052-.975 1.704 1.704 0 0 1 .053-1.443l.34-.654-.79-.79-.653.34a1.701 1.701 0 0 1-1.442.052 1.703 1.703 0 0 1-.974-1.053L8.56 2H7.45l-.222.7c-.16.507-.54.871-.973 1.052-.438.183-.97.195-1.444-.052l-.654-.34-.796.792.34.652c.246.475.234 1.006.051 1.443a1.705 1.705 0 0 1-1.052.975L2 7.444v1.112l.7.222c.506.16.87.541 1.051.975.183.437.195.968-.052 1.443l-.34.654.79.79.652-.34a1.702 1.702 0 0 1 1.444-.053c.433.182.813.546.973 1.052L7.44 14h1.111l.222-.7c.16-.507.54-.871.973-1.053.438-.182.97-.194 1.444.053l.652.34.79-.79-.341-.656a1.698 1.698 0 0 1-.052-1.44 1.7 1.7 0 0 1 1.06-.974L14 8.563v-1.11Z"
                ></path>
                <path fillRule="evenodd" d="M8 6a2 2 0 1 0 0 4 2 2 0 0 0 0-4ZM5 8a3 3 0 1 1 6 0 3 3 0 0 1-6 0Z"></path>
            </svg>
            {alt ? <span className="sr-only">{alt}</span> : null}
        </>
    );
};
