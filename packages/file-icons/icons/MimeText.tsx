/*
 * This file is auto-generated. Do not modify it manually!
 */
import React from 'react';

import clsx from '@proton/utils/clsx';

import { MIME_ICON_VIEWBOX, type MimeIconComponentProps, getMimeIconAsset } from '../component';

export const MimeText = ({ alt, title, size = 4, className, ...rest }: MimeIconComponentProps) => {
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
                        <rect width="16" height="16" rx="2" fill="#DADBE0"></rect>
                        <path d="M5 5.5H11M5 8H11M5 10.5H11" stroke="#3A3F4A" strokeLinecap="round"></path>
                    </g>
                )}
                {asset === 'md' && (
                    <g>
                        <path
                            d="M0 2.5C0 1.11929 1.11929 0 2.5 0H21.5C22.8807 0 24 1.11929 24 2.5V21.5C24 22.8807 22.8807 24 21.5 24H2.5C1.11929 24 0 22.8807 0 21.5V2.5Z"
                            fill="#DADBE0"
                        ></path>
                        <path
                            d="M7 8H17M7 12H17M7 16H17"
                            stroke="#3A3F4A"
                            strokeWidth="1.15"
                            strokeLinecap="round"
                        ></path>
                    </g>
                )}
                {asset === 'lg' && (
                    <g>
                        <path
                            d="M3.39001 7.825C3.39001 4.03081 6.46582 0.955002 10.26 0.955002H27.9481C29.7183 0.955002 31.4202 1.63833 32.6989 2.86251L42.4909 12.2369C43.8445 13.5328 44.61 15.3254 44.61 17.1993V42.175C44.61 45.9692 41.5342 49.045 37.74 49.045H10.26C6.46582 49.045 3.39001 45.9692 3.39001 42.175V7.825Z"
                            fill="#DADBE0"
                        ></path>
                        <path
                            d="M44.4742 15.84H35.45C32.2881 15.84 29.725 13.2768 29.725 10.115V1.18877C30.8322 1.48526 31.8572 2.05672 32.6989 2.86251L42.4908 12.2369C43.5121 13.2146 44.1987 14.4751 44.4742 15.84Z"
                            fill="#EBECF0"
                        ></path>
                        <path
                            d="M44.6099 17.5575H35.4499C31.3396 17.5575 28.0074 14.2254 28.0074 10.115V0.955246C28.5921 0.960299 29.1689 1.03985 29.7249 1.18876V10.115C29.7249 13.2768 32.2881 15.84 35.4499 15.84H44.4742C44.5638 16.2841 44.6099 16.7393 44.6099 17.1993V17.5575Z"
                            fill="#BABBC5"
                        ></path>
                        <path
                            d="M15 24H33M15 30H33M15 36H33"
                            stroke="#3A3F4A"
                            strokeWidth="2"
                            strokeLinecap="round"
                        ></path>
                    </g>
                )}
            </svg>
            {alt ? <span className="sr-only">{alt}</span> : null}
        </>
    );
};
