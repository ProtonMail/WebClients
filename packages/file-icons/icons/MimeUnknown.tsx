/*
 * This file is auto-generated. Do not modify it manually!
 */
import React from 'react';

import clsx from '@proton/utils/clsx';

import { MIME_ICON_VIEWBOX, type MimeIconComponentProps, getMimeIconAsset } from '../component';

export const MimeUnknown = ({ alt, title, size = 4, className, ...rest }: MimeIconComponentProps) => {
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
                        <path
                            d="M9 2C9 0.895431 9.89543 0 11 0H13.9045C15.2852 0 16 0.945348 16 2.10416V5C16 6.10457 15.1046 7 14 7H12C10.3432 7 9 5.65685 9 4V2Z"
                            fill="#EBECF0"
                        ></path>
                        <path
                            d="M16 7H11.3333C10.0447 7 9 5.95533 9 4.66667V1.52644e-06H9.7835C10 1.52644e-06 10.0873 0 10.1667 0V4.66667C10.1667 5.311 10.689 5.83333 11.3333 5.83333H16C16 6 16 6.08728 16 6.2165V7Z"
                            fill="#BABBC5"
                        ></path>
                    </g>
                )}
                {asset === 'md' && (
                    <g>
                        <path
                            d="M0 2.5C0 1.11929 1.11929 0 2.5 0H21.5C22.8807 0 24 1.11929 24 2.5V21.5C24 22.8807 22.8807 24 21.5 24H2.5C1.11929 24 0 22.8807 0 21.5V2.5Z"
                            fill="#DADBE0"
                        ></path>
                        <path
                            d="M16 0H21.5C22.8807 0 24 1.11929 24 2.5V8H19C17.3431 8 16 6.65685 16 5V0Z"
                            fill="#EBECF0"
                        ></path>
                        <path
                            d="M24 8H18.6667C17.1939 8 16 6.80609 16 5.33333V0H16.8954C17.0431 0 17 0 17.3333 1.13333e-05V5.33333C17.3333 6.06971 17.9303 6.66667 18.6667 6.66667H24C24 7 24 6.95689 24 7.10457V8Z"
                            fill="#BABBC5"
                        ></path>
                    </g>
                )}
                {asset === 'lg' && (
                    <g>
                        <path
                            d="M3.39001 7.82499C3.39001 4.03079 6.46582 0.954987 10.26 0.954987H27.9481C29.7183 0.954987 31.4202 1.63832 32.6989 2.8625L42.4909 12.2368C43.8445 13.5327 44.61 15.3254 44.61 17.1993V42.175C44.61 45.9692 41.5342 49.045 37.74 49.045H10.26C6.46582 49.045 3.39001 45.9692 3.39001 42.175V7.82499Z"
                            fill="#DADBE0"
                        ></path>
                        <path
                            d="M44.4742 15.84H35.45C32.2881 15.84 29.725 13.2768 29.725 10.115V1.18875C30.8322 1.48525 31.8572 2.05671 32.6989 2.86249L42.4908 12.2368C43.5121 13.2146 44.1987 14.4751 44.4742 15.84Z"
                            fill="#EBECF0"
                        ></path>
                        <path
                            d="M44.61 17.5575H35.45C31.3396 17.5575 28.0075 14.2254 28.0075 10.115V0.955231C28.5922 0.960284 29.169 1.03984 29.725 1.18874V10.115C29.725 13.2768 32.2882 15.84 35.45 15.84H44.4742C44.5639 16.2841 44.61 16.7393 44.61 17.1993V17.5575Z"
                            fill="#BABBC5"
                        ></path>
                    </g>
                )}
            </svg>
            {alt ? <span className="sr-only">{alt}</span> : null}
        </>
    );
};
