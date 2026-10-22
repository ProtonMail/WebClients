/*
 * This file is auto-generated. Do not modify it manually!
 */
import React from 'react';

import clsx from '@proton/utils/clsx';

import { MIME_ICON_VIEWBOX, type MimeIconComponentProps, getMimeIconAsset } from '../component';

export const MimeNumbers = ({ alt, title, size = 4, className, ...rest }: MimeIconComponentProps) => {
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
                        <rect width="16" height="16" rx="2" fill="#22C34F"></rect>
                        <rect x="4.7998" y="8.80005" width="1.6" height="2.4" rx="0.4" fill="white"></rect>
                        <rect x="7.2002" y="4.80005" width="1.6" height="6.4" rx="0.4" fill="white"></rect>
                        <rect x="9.6001" y="7.19995" width="1.6" height="4" rx="0.4" fill="white"></rect>
                    </g>
                )}
                {asset === 'md' && (
                    <g>
                        <path
                            d="M0 2.5C0 1.11929 1.11929 0 2.5 0H21.5C22.8807 0 24 1.11929 24 2.5V21.5C24 22.8807 22.8807 24 21.5 24H2.5C1.11929 24 0 22.8807 0 21.5V2.5Z"
                            fill="#22C34F"
                        ></path>
                        <rect x="6.3999" y="13.4" width="2.8" height="4.2" rx="0.7" fill="white"></rect>
                        <rect x="10.6001" y="6.40002" width="2.8" height="11.2" rx="0.7" fill="white"></rect>
                        <rect x="14.7998" y="10.6" width="2.8" height="7" rx="0.7" fill="white"></rect>
                    </g>
                )}
                {asset === 'lg' && (
                    <g>
                        <path
                            d="M3.38989 7.82496C3.38989 4.03076 6.4657 0.954956 10.2599 0.954956H27.948C29.7182 0.954956 31.4201 1.63829 32.6988 2.86247L42.4907 12.2368C43.8444 13.5327 44.6099 15.3253 44.6099 17.1993V42.175C44.6099 45.9692 41.5341 49.045 37.7399 49.045H10.2599C6.4657 49.045 3.38989 45.9692 3.38989 42.175V7.82496Z"
                            fill="#22C34F"
                        ></path>
                        <path
                            d="M44.4743 15.84H35.4501C32.2883 15.84 29.7251 13.2768 29.7251 10.115V1.18872C30.8323 1.48522 31.8573 2.05667 32.699 2.86246L42.491 12.2368C43.5123 13.2146 44.1988 14.4751 44.4743 15.84Z"
                            fill="#47EB62"
                        ></path>
                        <path
                            d="M44.6101 17.5574H35.4501C31.3397 17.5574 28.0076 14.2253 28.0076 10.1149V0.9552C28.5922 0.960253 29.169 1.03981 29.7251 1.18871V10.1149C29.7251 13.2768 32.2882 15.8399 35.4501 15.8399H44.4743C44.5639 16.2841 44.6101 16.7392 44.6101 17.1993V17.5574Z"
                            fill="#00AD1D"
                        ></path>
                        <rect x="16" y="32" width="4" height="6" rx="1" fill="white"></rect>
                        <rect x="22" y="22" width="4" height="16" rx="1" fill="white"></rect>
                        <rect x="28" y="28" width="4" height="10" rx="1" fill="white"></rect>
                    </g>
                )}
            </svg>
            {alt ? <span className="sr-only">{alt}</span> : null}
        </>
    );
};
