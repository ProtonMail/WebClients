/*
 * This file is auto-generated. Do not modify it manually!
 */
import React from 'react';

import clsx from '@proton/utils/clsx';

import { MIME_ICON_VIEWBOX, type MimeIconComponentProps, getMimeIconAsset } from '../component';

export const MimePpt = ({ alt, title, size = 4, className, ...rest }: MimeIconComponentProps) => {
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
                        <rect width="16" height="16" rx="2" fill="#F47425"></rect>
                        <path
                            d="M7.79622 5.20715C6.13618 5.20715 4.7998 6.55397 4.7998 8.20357C4.7998 9.85316 6.13618 11.2 7.79622 11.2C9.44581 11.2 10.7926 9.8636 10.7926 8.20357H7.79622V5.20715Z"
                            fill="white"
                        ></path>
                        <path
                            d="M8.20361 4.79999V7.7964H11.2C11.2 6.13637 9.86365 4.79999 8.20361 4.79999Z"
                            fill="white"
                        ></path>
                    </g>
                )}
                {asset === 'md' && (
                    <g>
                        <path
                            d="M0 2.5C0 1.11929 1.11929 0 2.5 0H21.5C22.8807 0 24 1.11929 24 2.5V21.5C24 22.8807 22.8807 24 21.5 24H2.5C1.11929 24 0 22.8807 0 21.5V2.5Z"
                            fill="#F47425"
                        ></path>
                        <path
                            d="M11.6436 7.11255C8.73857 7.11255 6.3999 9.46948 6.3999 12.3563C6.3999 15.2431 8.73857 17.6 11.6436 17.6C14.5304 17.6 16.8873 15.2613 16.8873 12.3563H11.6436V7.11255Z"
                            fill="white"
                        ></path>
                        <path
                            d="M12.356 6.40002V11.6437H17.5997C17.5997 8.73869 15.261 6.40002 12.356 6.40002Z"
                            fill="white"
                        ></path>
                    </g>
                )}
                {asset === 'lg' && (
                    <g>
                        <path
                            d="M3.38989 7.82499C3.38989 4.03079 6.4657 0.954987 10.2599 0.954987H27.948C29.7182 0.954987 31.4201 1.63832 32.6988 2.8625L42.4907 12.2368C43.8444 13.5327 44.6099 15.3254 44.6099 17.1993V42.175C44.6099 45.9692 41.5341 49.045 37.7399 49.045H10.2599C6.4657 49.045 3.38989 45.9692 3.38989 42.175V7.82499Z"
                            fill="#F47425"
                        ></path>
                        <path
                            d="M44.4743 15.84H35.4501C32.2883 15.84 29.7251 13.2768 29.7251 10.115V1.18875C30.8323 1.48525 31.8573 2.05671 32.699 2.86249L42.491 12.2368C43.5123 13.2146 44.1988 14.4751 44.4743 15.84Z"
                            fill="#FCA73E"
                        ></path>
                        <path
                            d="M44.6101 17.5575H35.4501C31.3397 17.5575 28.0076 14.2254 28.0076 10.115V0.955231C28.5922 0.960284 29.169 1.03984 29.7251 1.18874V10.115C29.7251 13.2768 32.2882 15.84 35.4501 15.84H44.4743C44.5639 16.2841 44.6101 16.7393 44.6101 17.1993V17.5575Z"
                            fill="#DE4F12"
                        ></path>
                        <path
                            d="M23.491 23C19.3409 23 16 26.367 16 30.491C16 34.615 19.3409 37.9821 23.491 37.9821C27.615 37.9821 30.9821 34.6411 30.9821 30.491H23.491V23Z"
                            fill="white"
                        ></path>
                        <path d="M24.5088 22V29.491H31.9998C31.9998 25.3409 28.6589 22 24.5088 22Z" fill="white"></path>
                    </g>
                )}
            </svg>
            {alt ? <span className="sr-only">{alt}</span> : null}
        </>
    );
};
