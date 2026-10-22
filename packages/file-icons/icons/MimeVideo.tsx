/*
 * This file is auto-generated. Do not modify it manually!
 */
import React from 'react';

import clsx from '@proton/utils/clsx';

import { MIME_ICON_VIEWBOX, type MimeIconComponentProps, getMimeIconAsset } from '../component';

export const MimeVideo = ({ alt, title, size = 4, className, ...rest }: MimeIconComponentProps) => {
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
                            d="M10.6653 7.39364C11.1116 7.66753 11.1116 8.32066 10.6653 8.59455L7.03448 10.891C6.56795 11.186 6 10.8489 6 10.28V5.70816C6 5.16038 6.58824 4.82329 7.03448 5.09718L10.6653 7.39364Z"
                            fill="#3A3F4A"
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
                            d="M15.5314 11.1915C16.1562 11.5567 16.1562 12.4275 15.5314 12.7927L10.4483 15.8547C9.79513 16.248 9 15.7985 9 15.04V8.94422C9 8.21384 9.82353 7.76438 10.4483 8.12957L15.5314 11.1915Z"
                            fill="#3A3F4A"
                        ></path>
                    </g>
                )}
                {asset === 'lg' && (
                    <g>
                        <path
                            d="M3.39001 7.82502C3.39001 4.03082 6.46582 0.955017 10.26 0.955017H27.9481C29.7183 0.955017 31.4202 1.63835 32.6989 2.86253L42.4909 12.2369C43.8445 13.5328 44.61 15.3254 44.61 17.1994V42.175C44.61 45.9692 41.5342 49.045 37.74 49.045H10.26C6.46582 49.045 3.39001 45.9692 3.39001 42.175V7.82502Z"
                            fill="#DADBE0"
                        ></path>
                        <path
                            d="M44.4742 15.84H35.45C32.2881 15.84 29.725 13.2768 29.725 10.115V1.18878C30.8322 1.48528 31.8572 2.05674 32.6989 2.86252L42.4908 12.2369C43.5121 13.2146 44.1987 14.4751 44.4742 15.84Z"
                            fill="#EBECF0"
                        ></path>
                        <path
                            d="M44.61 17.5575H35.45C31.3396 17.5575 28.0075 14.2254 28.0075 10.115V0.955261C28.5922 0.960314 29.169 1.03987 29.725 1.18877V10.115C29.725 13.2768 32.2882 15.84 35.45 15.84H44.4742C44.5639 16.2841 44.61 16.7393 44.61 17.1993V17.5575Z"
                            fill="#BABBC5"
                        ></path>
                        <path
                            d="M31.0629 26.383C32.3124 27.1134 32.3124 28.8551 31.0629 29.5855L20.8966 35.7094C19.5903 36.4959 18 35.597 18 34.0801V21.8884C18 20.4277 19.6471 19.5288 20.8966 20.2591L31.0629 26.383Z"
                            fill="#3A3F4A"
                        ></path>
                    </g>
                )}
            </svg>
            {alt ? <span className="sr-only">{alt}</span> : null}
        </>
    );
};
