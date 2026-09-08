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

export const IcMeetLayoutScreenShare = ({
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

                <path d="M5.36 11.36C6.465 11.36 7.36 12.256 7.36 13.36C7.36 14.465 6.464 15.36 5.36 15.36H2.641C1.536 15.36 0.64 14.465 0.64 13.36C0.64 12.256 1.536 11.36 2.641 11.36H5.36ZM13.36 11.36C14.465 11.36 15.36 12.256 15.36 13.36C15.36 14.465 14.464 15.36 13.36 15.36H10.641C9.536 15.36 8.641 14.465 8.641 13.36C8.641 12.256 9.536 11.36 10.641 11.36H13.36ZM2.641 12.64C2.243 12.64 1.92 12.962 1.92 13.36C1.92 13.758 2.243 14.08 2.641 14.08H5.36C5.758 14.079 6.08 13.758 6.08 13.36C6.08 12.963 5.758 12.64 5.36 12.64H2.641ZM10.641 12.64C10.243 12.64 9.92 12.962 9.92 13.36C9.92 13.758 10.243 14.08 10.641 14.08H13.36C13.758 14.079 14.08 13.758 14.08 13.36C14.08 12.963 13.758 12.64 13.36 12.64H10.641ZM13.36 0.64C14.464 0.64 15.36 1.536 15.36 2.64V8.08C15.36 9.184 14.465 10.079 13.36 10.08H2.641C1.536 10.08 0.64 9.184 0.64 8.08V2.64C0.64 1.535 1.536 0.64 2.641 0.64H13.36ZM2.641 1.92C2.243 1.92 1.92 2.242 1.92 2.64V8.08C1.92 8.477 2.243 8.8 2.641 8.8H13.36C13.758 8.8 14.08 8.477 14.08 8.08V2.64C14.08 2.242 13.758 1.92 13.36 1.92H2.641ZM8.023 2.321C8.028 2.321 8.033 2.322 8.038 2.322C8.073 2.324 8.108 2.328 8.142 2.336C8.144 2.336 8.146 2.337 8.148 2.338C8.242 2.36 8.326 2.405 8.399 2.464C8.417 2.478 8.436 2.491 8.452 2.508L9.893 3.948C10.143 4.198 10.142 4.602 9.893 4.852C9.643 5.102 9.237 5.102 8.988 4.852L8.64 4.505V8C8.64 8.353 8.353 8.64 8 8.64C7.647 8.64 7.36 8.353 7.36 8V4.505L7.012 4.852C6.763 5.102 6.358 5.102 6.108 4.852C5.858 4.602 5.858 4.198 6.108 3.948L7.548 2.508L7.596 2.464C7.604 2.458 7.612 2.453 7.62 2.447C7.641 2.432 7.662 2.417 7.684 2.404C7.691 2.4 7.698 2.396 7.705 2.392C7.768 2.36 7.837 2.337 7.91 2.327C7.913 2.326 7.916 2.325 7.92 2.325C7.946 2.322 7.973 2.32 8 2.32C8.008 2.32 8.015 2.321 8.023 2.321Z"></path>
            </svg>
            {alt ? <span className="sr-only">{alt}</span> : null}
        </>
    );
};
