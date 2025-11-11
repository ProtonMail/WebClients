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

export const IcSwitchOn = ({ alt, title, size = 4, className = '', viewBox = '0 0 16 16', ...rest }: IconProps) => {
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
                    d="M4 2c0-.552.454-1 1.015-1h5.583c.56 0 1.015.448 1.015 1v5.354l3.275 5.07c.264.41.034.93-.405 1.05l-2.574 1.435a.72.72 0 0 1-.35.09H5.026a.6.6 0 0 1-.019 0h-.295A.705.705 0 0 1 4 14.3V7.5h.008A.986.986 0 0 1 4 7.372V2Zm1.015 7.46v4.465l1.889-1.053-1.889-3.411ZM7.84 13.5l-.897.5h4.537l.897-.5H7.839Zm5.895-1L10.757 7.89a.989.989 0 0 1-.16-.537V2H5.016v5.372L7.854 12.5h5.88ZM8.06 4c.28 0 .508.224.508.5V6c0 .276-.227.5-.508.5a.504.504 0 0 1-.507-.5V4.5c0-.276.227-.5.507-.5ZM9.34 9.957c-.1-.042-.149-.022-.162-.015-.012.007-.054.039-.067.146a.68.68 0 0 0 .101.412c.09.155.211.25.312.293.1.042.15.022.162.015.013-.007.054-.039.067-.146a.68.68 0 0 0-.101-.412.694.694 0 0 0-.312-.293Zm.399-.92a1.7 1.7 0 0 1 .792.713c.19.324.272.69.23 1.032-.042.342-.216.692-.568.892-.351.2-.746.174-1.068.038A1.7 1.7 0 0 1 8.332 11a1.663 1.663 0 0 1-.23-1.032c.042-.342.216-.692.568-.892.351-.2.746-.174 1.068-.038Z"
                ></path>
            </svg>
            {alt ? <span className="sr-only">{alt}</span> : null}
        </>
    );
};
