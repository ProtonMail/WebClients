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

export const IcMeetScreenShare = ({
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

                <path d="M5.25 3.5C5.66421 3.5 6 3.83579 6 4.25C6 4.66421 5.66421 5 5.25 5H4.25C3.55964 5 3 5.55964 3 6.25V15.25C3 15.9404 3.55964 16.5 4.25 16.5H20.25C20.9404 16.5 21.5 15.9404 21.5 15.25V6.25C21.5 5.55964 20.9404 5 20.25 5H19.25C18.8358 5 18.5 4.66421 18.5 4.25C18.5 3.83579 18.8358 3.5 19.25 3.5H20.25C21.7688 3.5 23 4.73122 23 6.25V15.25C23 16.7688 21.7688 18 20.25 18H13V20.5H17.25C17.6642 20.5 18 20.8358 18 21.25C18 21.6642 17.6642 22 17.25 22H7.25C6.83579 22 6.5 21.6642 6.5 21.25C6.5 20.8358 6.83579 20.5 7.25 20.5H11.5V18H4.25C2.73122 18 1.5 16.7688 1.5 15.25V6.25C1.5 4.73122 2.73122 3.5 4.25 3.5H5.25Z"></path>
                <path d="M12.2766 2.00098C12.2832 2.00121 12.2897 2.00155 12.2962 2.00195C12.3342 2.00426 12.3712 2.00982 12.4075 2.01758C12.4348 2.02341 12.4609 2.03309 12.4876 2.04199C12.5373 2.05869 12.5847 2.07924 12.6292 2.10547C12.6828 2.13702 12.7345 2.17371 12.7805 2.21973L17.0227 6.46191C17.3156 6.75481 17.3156 7.23055 17.0227 7.52344C16.7299 7.81591 16.255 7.81593 15.9622 7.52344L13.0003 4.56152V11.25C13.0003 11.6641 12.6644 11.9998 12.2503 12C11.8361 12 11.5003 11.6642 11.5003 11.25V4.55957L8.53738 7.52344C8.24455 7.81589 7.76963 7.81595 7.47684 7.52344C7.18406 7.23057 7.18406 6.75479 7.47684 6.46191L11.719 2.21973L11.7766 2.16797C11.7857 2.1606 11.7957 2.15434 11.805 2.14746C11.8225 2.13446 11.8409 2.12278 11.8596 2.11133C11.882 2.09767 11.9047 2.08533 11.928 2.07422C11.9477 2.0648 11.9679 2.05653 11.9886 2.04883C12.0132 2.03964 12.0384 2.03286 12.0638 2.02637C12.0901 2.0196 12.1164 2.0117 12.1438 2.00781C12.1477 2.00726 12.1516 2.00635 12.1555 2.00586C12.1865 2.00197 12.2183 2 12.2503 2C12.2591 2 12.2679 2.00067 12.2766 2.00098Z"></path>
            </svg>
            {alt ? <span className="sr-only">{alt}</span> : null}
        </>
    );
};
