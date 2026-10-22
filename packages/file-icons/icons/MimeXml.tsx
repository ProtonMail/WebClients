/*
 * This file is auto-generated. Do not modify it manually!
 */
import React from 'react';

import clsx from '@proton/utils/clsx';

import { MIME_ICON_VIEWBOX, type MimeIconComponentProps, getMimeIconAsset } from '../component';

export const MimeXml = ({ alt, title, size = 4, className, ...rest }: MimeIconComponentProps) => {
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
                    <g fill="none">
                        <rect width="16" height="16" fill="#DADBE0" rx="2"></rect>
                        <path
                            stroke="#3A3F4A"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth=".8"
                            d="m10 6.4 1.6 1.4L10 9.2M6 6.4 4.4 7.8 6 9.2"
                        ></path>
                        <rect
                            width="5.461"
                            height=".8"
                            x="6.9"
                            y="10.239"
                            fill="#3A3F4A"
                            rx=".4"
                            transform="rotate(-75 6.9 10.239)"
                        ></rect>
                    </g>
                )}
                {asset === 'md' && (
                    <g fill="none">
                        <path
                            d="M0 2.5C0 1.11929 1.11929 0 2.5 0H21.5C22.8807 0 24 1.11929 24 2.5V21.5C24 22.8807 22.8807 24 21.5 24H2.5C1.11929 24 0 22.8807 0 21.5V2.5Z"
                            fill="#DADBE0"
                        ></path>
                        <path
                            d="M15.5 9.19995L18.3 11.65L15.5 14.1"
                            stroke="#3A3F4A"
                            strokeWidth="1.4"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        ></path>
                        <path
                            d="M8.5 9.19995L5.7 11.65L8.5 14.1"
                            stroke="#3A3F4A"
                            strokeWidth="1.4"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        ></path>
                        <rect
                            x="10.075"
                            y="15.9182"
                            width="9.55593"
                            height="1.4"
                            rx="0.7"
                            transform="rotate(-75 10.075 15.9182)"
                            fill="#3A3F4A"
                        ></rect>
                    </g>
                )}
                {asset === 'lg' && (
                    <g fill="none">
                        <path
                            d="M3.39001 7.82496C3.39001 4.03076 6.46582 0.954956 10.26 0.954956H27.9481C29.7183 0.954956 31.4202 1.63829 32.6989 2.86247L42.4909 12.2368C43.8445 13.5327 44.61 15.3253 44.61 17.1993V42.175C44.61 45.9692 41.5342 49.045 37.74 49.045H10.26C6.46582 49.045 3.39001 45.9692 3.39001 42.175V7.82496Z"
                            fill="#DADBE0"
                        ></path>
                        <path
                            d="M44.4742 15.84H35.45C32.2881 15.84 29.725 13.2768 29.725 10.115V1.18872C30.8322 1.48522 31.8572 2.05667 32.6989 2.86246L42.4908 12.2368C43.5121 13.2146 44.1987 14.4751 44.4742 15.84Z"
                            fill="#EBECF0"
                        ></path>
                        <path
                            d="M44.6099 17.5574H35.4499C31.3396 17.5574 28.0074 14.2253 28.0074 10.1149V0.9552C28.5921 0.960253 29.1689 1.03981 29.7249 1.18871V10.1149C29.7249 13.2768 32.2881 15.8399 35.4499 15.8399H44.4742C44.5638 16.2841 44.6099 16.7392 44.6099 17.1993V17.5574Z"
                            fill="#BABBC5"
                        ></path>
                        <path
                            d="M29 24L33 27.5L29 31"
                            stroke="#3A3F4A"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        ></path>
                        <path
                            d="M19 24L15 27.5L19 31"
                            stroke="#3A3F4A"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        ></path>
                        <rect
                            x="21.25"
                            y="33.5974"
                            width="13.6513"
                            height="2"
                            rx="1"
                            transform="rotate(-75 21.25 33.5974)"
                            fill="#3A3F4A"
                        ></rect>
                    </g>
                )}
            </svg>
            {alt ? <span className="sr-only">{alt}</span> : null}
        </>
    );
};
