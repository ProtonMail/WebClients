/*
 * This file is auto-generated. Do not modify it manually!
 */
import React, { useId } from 'react';

import clsx from '@proton/utils/clsx';

import { MIME_ICON_VIEWBOX, type MimeIconComponentProps, getMimeIconAsset } from '../component';

export const MimeProtonSheet = ({ alt, title, size = 4, className, ...rest }: MimeIconComponentProps) => {
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
                        <path
                            fill={`url(#${id}-sm-gradient)`}
                            d="M0 2.667A2.667 2.667 0 0 1 2.667 0h10.666A2.667 2.667 0 0 1 16 2.667v10.666A2.667 2.667 0 0 1 13.333 16H2.667A2.667 2.667 0 0 1 0 13.333V2.667Z"
                        ></path>
                        <path
                            fill="#fff"
                            d="M5.216 6.272c.371 0 .672.301.672.672v3.04h3.424a.673.673 0 1 1 0 1.344H5.888v1.312a.672.672 0 1 1-1.344 0v-1.312H2.976a.672.672 0 0 1 0-1.344h1.568v-3.04c0-.37.3-.671.672-.672Z"
                        ></path>
                        <path fill="#fff" d="M8 0h4v4H8V0Z" fillOpacity=".5"></path>
                        <path fill="#fff" fillOpacity=".8" d="M12 0h1.333A2.667 2.667 0 0 1 16 2.667V4h-4V0Z"></path>
                        <path fill="#fff" fillOpacity=".5" d="M12 4h4v4h-4V4Z"></path>
                        <radialGradient
                            id={`${id}-sm-gradient`}
                            cx="0"
                            cy="0"
                            r="1"
                            gradientTransform="rotate(-53.15 18.634 10.704) scale(18.8804)"
                            gradientUnits="userSpaceOnUse"
                        >
                            <stop stopColor="#1B854C"></stop>
                            <stop offset="1" stopColor="#26DA79"></stop>
                        </radialGradient>
                        <clipPath id={`${id}-sm-clip-path`}>
                            <path fill="#fff" d="M0 0h16v16H0z"></path>
                        </clipPath>
                    </g>
                )}
                {asset === 'md' && (
                    <g clipPath={`url(#${id}-md-clip-path)`}>
                        <path
                            fill={`url(#${id}-md-gradient)`}
                            d="M0 4a4 4 0 0 1 4-4h16a4 4 0 0 1 4 4v16a4 4 0 0 1-4 4H4a4 4 0 0 1-4-4V4Z"
                        ></path>
                        <path
                            fill="#fff"
                            d="M7.824 9.408c.557 0 1.008.451 1.008 1.008v4.56h5.136a1.009 1.009 0 0 1 0 2.016H8.832v1.968a1.008 1.008 0 0 1-2.016 0v-1.968H4.464a1.008 1.008 0 0 1 0-2.016h2.352v-4.56c0-.557.452-1.008 1.008-1.008Z"
                        ></path>
                        <path fill="#fff" fillOpacity=".5" d="M12 0h6v6h-6V0Z"></path>
                        <path fill="#fff" fillOpacity=".8" d="M18 0h2a4 4 0 0 1 4 4v2h-6V0Z"></path>
                        <path fill="#fff" fillOpacity=".5" d="M18 6h6v6h-6V6Z"></path>
                        <radialGradient
                            id={`${id}-md-gradient`}
                            cx="0"
                            cy="0"
                            r="1"
                            gradientTransform="rotate(-53.15 27.95 16.055) scale(28.3206)"
                            gradientUnits="userSpaceOnUse"
                        >
                            <stop stopColor="#1B854C"></stop>
                            <stop offset="1" stopColor="#26DA79"></stop>
                        </radialGradient>
                        <clipPath id={`${id}-md-clip-path`}>
                            <path fill="#fff" d="M0 0h24v24H0z"></path>
                        </clipPath>
                    </g>
                )}
                {asset === 'lg' && (
                    <g clipPath={`url(#${id}-lg-clip-path)`}>
                        <path
                            fill={`url(#${id}-lg-gradient)`}
                            d="M0 8a8 8 0 0 1 8-8h32a8 8 0 0 1 8 8v32a8 8 0 0 1-8 8H8a8 8 0 0 1-8-8V8Z"
                        ></path>
                        <path
                            fill="#fff"
                            d="M15.648 18.816c1.114 0 2.016.903 2.016 2.016v9.12h10.271a2.016 2.016 0 1 1 0 4.032h-10.27v3.936a2.016 2.016 0 0 1-4.033 0v-3.936H8.928a2.016 2.016 0 0 1 0-4.032h4.704v-9.12c0-1.113.903-2.016 2.016-2.016Z"
                        ></path>
                        <path fill="#fff" fillOpacity=".5" d="M24 0h12v12H24V0Z"></path>
                        <path fill="#fff" fillOpacity=".8" d="M36 0h4a8 8 0 0 1 8 8v4H36V0Z"></path>
                        <path fill="#fff" fillOpacity=".5" d="M36 12h12v12H36V12Z"></path>
                        <radialGradient
                            id={`${id}-lg-gradient`}
                            cx="0"
                            cy="0"
                            r="1"
                            gradientTransform="rotate(-53.15 55.901 32.11) scale(56.6412)"
                            gradientUnits="userSpaceOnUse"
                        >
                            <stop stopColor="#1B854C"></stop>
                            <stop offset="1" stopColor="#26DA79"></stop>
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
