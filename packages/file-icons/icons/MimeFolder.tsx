/*
 * This file is auto-generated. Do not modify it manually!
 */
import React from 'react';

import clsx from '@proton/utils/clsx';

import { MIME_ICON_VIEWBOX, type MimeIconComponentProps, getMimeIconAsset } from '../component';

export const MimeFolder = ({ alt, title, size = 4, className, ...rest }: MimeIconComponentProps) => {
    const asset = getMimeIconAsset(size);

    return (
        <>
            <svg
                role="img"
                viewBox={MIME_ICON_VIEWBOX[asset]}
                focusable="false"
                className={clsx(`icon-size-${size}`, className)}
                {...rest}
            >
                {title ? <title>{title}</title> : null}
                {asset === 'sm' && (
                    <g>
                        <path
                            fillRule="evenodd"
                            clipRule="evenodd"
                            d="M15 12.8V5C15 4.33726 14.4777 3.8 13.8333 3.8H8.66111C8.35819 3.8 8.06345 3.69894 7.82111 3.512L6.17222 2.24C5.97028 2.08421 5.72465 2 5.47222 2H2.16667C1.52233 2 1 2.53726 1 3.2V12.8C1 13.4627 1.52233 14 2.16667 14H13.8333C14.4777 14 15 13.4627 15 12.8Z"
                            fill="#F5A623"
                        ></path>
                    </g>
                )}
                {asset === 'md' && (
                    <g>
                        <path
                            fillRule="evenodd"
                            clipRule="evenodd"
                            d="M22 18.4646V7.9596C22 7.11164 21.2852 6.42424 20.4034 6.42424H12.9524C12.4978 6.42424 12.0555 6.28247 11.6919 6.0202L9.31653 4.30707C9.04015 4.10775 8.70401 4 8.35854 4H3.59664C2.71484 4 2 4.6874 2 5.53535V18.4646C2 19.3126 2.71484 20 3.59664 20H20.4034C21.2852 20 22 19.3126 22 18.4646Z"
                            fill="#F5A623"
                        ></path>
                    </g>
                )}
                {asset === 'lg' && (
                    <g>
                        <path
                            fillRule="evenodd"
                            clipRule="evenodd"
                            d="M45 37.9355V15.2903C45 13.0456 43.1942 11 41 11H25.9027C25.1413 11 24.4005 10.7474 23.7914 10.28L19.0054 6.8129C18.3177 6.28524 17.4813 6 16.6216 6H6.97297C4.77876 6 3 7.81975 3 10.0645V37.9355C3 40.1803 4.77876 42 6.97297 42H41.027C43.2212 42 45 40.1803 45 37.9355Z"
                            fill="#F5A623"
                        ></path>
                    </g>
                )}
            </svg>
            {alt ? <span className="sr-only">{alt}</span> : null}
        </>
    );
};
