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

export const IcPassShieldFillDanger = ({
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
                    clipRule="evenodd"
                    d="M8.85436 1.27869C8.30246 1.078 7.69754 1.078 7.14564 1.27869L2.32913 3.03015C2.13153 3.102 2 3.28979 2 3.50005V9.12551C2 10.7723 2.89949 12.2875 4.34517 13.076L7.76057 14.939C7.90981 15.0204 8.09019 15.0204 8.23943 14.939L11.6548 13.076C13.1005 12.2875 14 10.7723 14 9.12551V3.50005C14 3.28979 13.8685 3.102 13.6709 3.03015L8.85436 1.27869ZM5.52492 5.73223C5.32965 5.53697 5.32965 5.22038 5.52492 5.02512C5.72018 4.82986 6.03676 4.82986 6.23202 5.02512L7.99978 6.79288L9.76753 5.02513C9.96279 4.82987 10.2794 4.82987 10.4746 5.02513C10.6699 5.22039 10.6699 5.53697 10.4746 5.73224L8.70689 7.49999L10.4747 9.26776C10.6699 9.46302 10.6699 9.77961 10.4747 9.97487C10.2794 10.1701 9.96282 10.1701 9.76756 9.97487L7.99978 8.20709L6.232 9.97488C6.03673 10.1701 5.72015 10.1701 5.52489 9.97488C5.32963 9.77962 5.32963 9.46303 5.52489 9.26777L7.29267 7.49999L5.52492 5.73223Z"
                ></path>
            </svg>
            {alt ? <span className="sr-only">{alt}</span> : null}
        </>
    );
};
