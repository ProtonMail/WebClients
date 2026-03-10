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

export const IcBrandFacebook = ({
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

                <path d="M15 8.05127C15 4.18528 11.866 1.05127 8 1.05127C4.13401 1.05127 1 4.18528 1 8.05127C1 11.3341 3.26002 14.0887 6.30897 14.8451V10.1904H4.86551V8.05127H6.30897V7.12954C6.30897 4.74696 7.38719 3.64264 9.72631 3.64264C10.1698 3.64264 10.935 3.72958 11.248 3.81655V5.75566C11.0828 5.73827 10.7959 5.72957 10.4393 5.72957C9.29153 5.72957 8.84804 6.16435 8.84804 7.29476V8.05127H11.1345L10.7417 10.1904H8.84804V15C12.314 14.5814 15 11.6302 15 8.05127Z"></path>
            </svg>
            {alt ? <span className="sr-only">{alt}</span> : null}
        </>
    );
};
