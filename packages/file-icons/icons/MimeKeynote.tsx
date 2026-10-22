/*
 * This file is auto-generated. Do not modify it manually!
 */
import React from 'react';

import clsx from '@proton/utils/clsx';

import { MIME_ICON_VIEWBOX, type MimeIconComponentProps, getMimeIconAsset } from '../component';

export const MimeKeynote = ({ alt, title, size = 4, className, ...rest }: MimeIconComponentProps) => {
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
                        <rect width="16" height="16" rx="2" fill="#24B0FF"></rect>
                        <path
                            d="M4.7998 5.59995C4.7998 5.37904 4.97889 5.19995 5.1998 5.19995H10.7998C11.0207 5.19995 11.1998 5.37904 11.1998 5.59995V8.39995H4.7998V5.59995Z"
                            fill="white"
                        ></path>
                        <path d="M7.6001 9.59998H8.4001V11.2H7.6001V9.59998Z" fill="white"></path>
                        <rect
                            x="9.6001"
                            y="11.2"
                            width="0.4"
                            height="3.2"
                            rx="0.2"
                            transform="rotate(90 9.6001 11.2)"
                            fill="white"
                        ></rect>
                        <rect
                            x="11.2002"
                            y="8.80005"
                            width="0.4"
                            height="6.4"
                            rx="0.2"
                            transform="rotate(90 11.2002 8.80005)"
                            fill="white"
                        ></rect>
                    </g>
                )}
                {asset === 'md' && (
                    <g>
                        <path
                            d="M0 2.5C0 1.11929 1.11929 0 2.5 0H21.5C22.8807 0 24 1.11929 24 2.5V21.5C24 22.8807 22.8807 24 21.5 24H2.5C1.11929 24 0 22.8807 0 21.5V2.5Z"
                            fill="#24B0FF"
                        ></path>
                        <path
                            d="M6.3999 7.79997C6.3999 7.41338 6.7133 7.09998 7.0999 7.09998H16.8999C17.2865 7.09998 17.5999 7.41338 17.5999 7.79998V12.7H6.3999V7.79997Z"
                            fill="white"
                        ></path>
                        <path d="M11.2998 14.8H12.6998V17.6H11.2998V14.8Z" fill="white"></path>
                        <rect
                            x="14.7998"
                            y="17.6"
                            width="0.7"
                            height="5.6"
                            rx="0.35"
                            transform="rotate(90 14.7998 17.6)"
                            fill="white"
                        ></rect>
                        <rect
                            x="17.6001"
                            y="13.4"
                            width="0.700001"
                            height="11.2"
                            rx="0.35"
                            transform="rotate(90 17.6001 13.4)"
                            fill="white"
                        ></rect>
                    </g>
                )}
                {asset === 'lg' && (
                    <g>
                        <path
                            d="M3.38989 7.82496C3.38989 4.03076 6.4657 0.954956 10.2599 0.954956H27.948C29.7182 0.954956 31.4201 1.63829 32.6988 2.86247L42.4907 12.2368C43.8444 13.5327 44.6099 15.3253 44.6099 17.1993V42.175C44.6099 45.9692 41.5341 49.045 37.7399 49.045H10.2599C6.4657 49.045 3.38989 45.9692 3.38989 42.175V7.82496Z"
                            fill="#24B0FF"
                        ></path>
                        <path
                            d="M44.4743 15.84H35.4501C32.2883 15.84 29.7251 13.2768 29.7251 10.115V1.18872C30.8323 1.48522 31.8573 2.05667 32.699 2.86246L42.491 12.2368C43.5123 13.2146 44.1988 14.4751 44.4743 15.84Z"
                            fill="#52D4FF"
                        ></path>
                        <path
                            d="M44.6101 17.5574H35.4501C31.3397 17.5574 28.0076 14.2253 28.0076 10.1149V0.9552C28.5922 0.960253 29.169 1.03981 29.7251 1.18871V10.1149C29.7251 13.2768 32.2882 15.8399 35.4501 15.8399H44.4743C44.5639 16.2841 44.6101 16.7392 44.6101 17.1993V17.5574Z"
                            fill="#0093FF"
                        ></path>
                        <path
                            d="M16 24C16 23.4477 16.4477 23 17 23H31C31.5523 23 32 23.4477 32 24V31H16V24Z"
                            fill="white"
                        ></path>
                        <path d="M23 34H25V38H23V34Z" fill="white"></path>
                        <rect
                            x="28"
                            y="38"
                            width="1"
                            height="8"
                            rx="0.5"
                            transform="rotate(90 28 38)"
                            fill="white"
                        ></rect>
                        <rect
                            x="32"
                            y="32"
                            width="1"
                            height="16"
                            rx="0.5"
                            transform="rotate(90 32 32)"
                            fill="white"
                        ></rect>
                    </g>
                )}
            </svg>
            {alt ? <span className="sr-only">{alt}</span> : null}
        </>
    );
};
