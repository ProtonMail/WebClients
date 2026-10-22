/*
 * This file is auto-generated. Do not modify it manually!
 */
import React, { useId } from 'react';

import clsx from '@proton/utils/clsx';

import { MIME_ICON_VIEWBOX, type MimeIconComponentProps, getMimeIconAsset } from '../component';

export const MimeProtonDoc = ({ alt, title, size = 4, className, ...rest }: MimeIconComponentProps) => {
    const asset = getMimeIconAsset(size);
    // Gradient, mask and clip path ids must be unique per instance: a hidden earlier copy would blank later ones.
    const id = useId().replace(/:/g, '');

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
                    <g clipPath={`url(#${id}-sm-clip-path)`}>
                        <mask
                            id={`${id}-sm-mask`}
                            width="16"
                            height="16"
                            x="0"
                            y="0"
                            maskUnits="userSpaceOnUse"
                            style={{ maskType: 'luminance' }}
                        >
                            <path fill="#fff" d="M16 0H0v16h16V0Z"></path>
                        </mask>
                        <g mask={`url(#${id}-sm-mask)`}>
                            <path
                                fill={`url(#${id}-sm-gradient)`}
                                d="M13.333 0H2.667A2.667 2.667 0 0 0 0 2.667v10.666A2.667 2.667 0 0 0 2.667 16h10.666A2.667 2.667 0 0 0 16 13.333V2.667A2.667 2.667 0 0 0 13.333 0Z"
                            ></path>
                            <path fill="#85D4F5" d="M12 0H8v4h4V0Z"></path>
                            <path fill="#D6F1FC" d="M12 0h1.333A2.667 2.667 0 0 1 16 2.667V4h-4V0Z"></path>
                            <path fill="#85D4F5" d="M16 4h-4v4h4V4Z"></path>
                            <path
                                fill="#fff"
                                fillRule="evenodd"
                                d="M8.667 12.667a.667.667 0 0 1-.667.666H3.333a.667.667 0 1 1 0-1.333H8c.368 0 .667.299.667.667ZM6.667 10a.667.667 0 0 1-.667.667H3.333a.667.667 0 0 1 0-1.334H6c.368 0 .667.299.667.667Z"
                                clipRule="evenodd"
                            ></path>
                        </g>
                        <radialGradient
                            id={`${id}-sm-gradient`}
                            cx="0"
                            cy="0"
                            r="1"
                            gradientTransform="rotate(-53.15 18.634 10.704) scale(18.8804)"
                            gradientUnits="userSpaceOnUse"
                        >
                            <stop stopColor="#6D4AFF"></stop>
                            <stop offset="1" stopColor="#34B8EE"></stop>
                        </radialGradient>
                        <clipPath id={`${id}-sm-clip-path`}>
                            <path fill="#fff" d="M0 0h16v16H0z"></path>
                        </clipPath>
                    </g>
                )}
                {asset === 'md' && (
                    <g clipPath={`url(#${id}-md-clip-path)`}>
                        <mask
                            id={`${id}-md-mask`}
                            width="24"
                            height="24"
                            x="0"
                            y="0"
                            maskUnits="userSpaceOnUse"
                            style={{ maskType: 'luminance' }}
                        >
                            <path fill="#fff" d="M24 0H0v24h24V0Z"></path>
                        </mask>
                        <g mask={`url(#${id}-md-mask)`}>
                            <path
                                fill={`url(#${id}-md-gradient)`}
                                d="M20 0H4a4 4 0 0 0-4 4v16a4 4 0 0 0 4 4h16a4 4 0 0 0 4-4V4a4 4 0 0 0-4-4Z"
                            ></path>
                            <path fill="#85D4F5" d="M18 0h-6v6h6V0Z"></path>
                            <path fill="#D6F1FC" d="M18 0h2a4 4 0 0 1 4 4v2h-6V0Z"></path>
                            <path fill="#85D4F5" d="M24 6h-6v6h6V6Z"></path>
                            <path
                                fill="#fff"
                                fillRule="evenodd"
                                d="M13 19a1 1 0 0 1-1 1H5a1 1 0 1 1 0-2h7a1 1 0 0 1 1 1ZM10 15a1 1 0 0 1-1 1H5a1 1 0 1 1 0-2h4a1 1 0 0 1 1 1Z"
                                clipRule="evenodd"
                            ></path>
                        </g>
                        <radialGradient
                            id={`${id}-md-gradient`}
                            cx="0"
                            cy="0"
                            r="1"
                            gradientTransform="rotate(-53.15 27.95 16.055) scale(28.3206)"
                            gradientUnits="userSpaceOnUse"
                        >
                            <stop stopColor="#6D4AFF"></stop>
                            <stop offset="1" stopColor="#34B8EE"></stop>
                        </radialGradient>
                        <clipPath id={`${id}-md-clip-path`}>
                            <path fill="#fff" d="M0 0h24v24H0z"></path>
                        </clipPath>
                    </g>
                )}
                {asset === 'lg' && (
                    <g clipPath={`url(#${id}-lg-clip-path)`}>
                        <rect width="40" height="48.09" x="4" fill={`url(#${id}-lg-gradient)`} rx="7"></rect>
                        <path fill="#85D4F5" d="M32 0H20v12h12V0Z"></path>
                        <path fill="#D6F1FC" d="M37 0h-5v12h12V7a7 7 0 0 0-7-7Z"></path>
                        <path fill="#85D4F5" d="M44 12H32v12h12V12Z"></path>
                        <path
                            fill="#fff"
                            fillRule="evenodd"
                            d="M28 38a2 2 0 0 1-2 2H12a2 2 0 1 1 0-4h14a2 2 0 0 1 2 2ZM22 30a2 2 0 0 1-2 2h-8a2 2 0 1 1 0-4h8a2 2 0 0 1 2 2Z"
                            clipRule="evenodd"
                        ></path>
                        <radialGradient
                            id={`${id}-lg-gradient`}
                            cx="0"
                            cy="0"
                            r="1"
                            gradientTransform="rotate(-58.062 52.592 27.735) scale(53.5104 50.0563)"
                            gradientUnits="userSpaceOnUse"
                        >
                            <stop stopColor="#6D4AFF"></stop>
                            <stop offset="1" stopColor="#34B8EE"></stop>
                        </radialGradient>
                        <clipPath id={`${id}-lg-clip-path`}>
                            <path fill="#fff" d="M0 0h48v48H0z"></path>
                        </clipPath>
                    </g>
                )}
            </svg>
            {alt ? <span className="sr-only">{alt}</span> : null}
        </>
    );
};
