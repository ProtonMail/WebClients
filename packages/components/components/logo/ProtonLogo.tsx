import type { ComponentPropsWithoutRef } from 'react';
import { useState } from 'react';

import generateUID from '@proton/atoms/generateUID';
import type { LogoProps } from '@proton/components';
import { BRAND_NAME } from '@proton/shared/lib/constants';
import clsx from '@proton/utils/clsx';

type Version = 'full' | 'glyph-only';
type Color = 'brand' | 'invert';

interface Props extends ComponentPropsWithoutRef<'svg'>, Pick<LogoProps, 'size'> {
    variant?: Version;
    color?: Color;
}

const ProtonLogo = ({ variant = 'full', size, color = 'brand', className, ...rest }: Props) => {
    // This logo can be several times in the view, ids has to be different each time
    const [uid] = useState(generateUID('logo'));
    const brandColor = '#6351E1';
    const invertColor = 'white';

    return variant === 'full' ? (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            xmlnsXlink="http://www.w3.org/1999/xlink"
            viewBox="0 0 96 36"
            width="96"
            height="36"
            fill="none"
            role="img"
            className={clsx('logo', size && `icon-size-${size}`, variant, className)}
            aria-labelledby={`${uid}-title`}
            {...rest}
        >
            <title id={`${uid}-title`}>{BRAND_NAME}</title>
            <path
                fill={color === 'brand' ? brandColor : invertColor}
                d="M0 23.793v6.265h4.397v-5.993a2.199 2.199 0 0 1 2.199-2.199h4.509a7.933 7.933 0 0 0 7.932-7.932A7.932 7.932 0 0 0 11.105 6H0v7.83h4.397v-3.69h6.41a3.754 3.754 0 0 1 3.753 3.753 3.754 3.754 0 0 1-3.753 3.753h-4.66A6.146 6.146 0 0 0 0 23.793z"
            />
            <path
                fill={color === 'brand' ? `url(#${uid}-a)` : undefined}
                d="M6.595 21.865A6.594 6.594 0 0 0 0 28.46v1.597h4.397v-5.993a2.199 2.199 0 0 1 2.198-2.199z"
            />
            <path
                fill={color === 'brand' ? brandColor : invertColor}
                d="M19.717 30.058v-9.544c0-3.894 2.274-6.995 6.822-6.995.73-.01 1.459.07 2.169.24v3.928c-.518-.034-.964-.034-1.172-.034-2.41 0-3.445 1.103-3.445 3.343v9.06l-4.374.002zm10.301-8.098c0-4.789 3.617-8.441 8.648-8.441s8.649 3.652 8.649 8.442c0 4.789-3.618 8.476-8.649 8.476-5.03 0-8.648-3.688-8.648-8.476zm12.99 0c0-2.722-1.827-4.65-4.342-4.65-2.514 0-4.341 1.927-4.341 4.65 0 2.757 1.826 4.652 4.341 4.652 2.516 0 4.342-1.895 4.342-4.651zm18.295 0c0-4.789 3.618-8.441 8.648-8.441 5.031 0 8.649 3.652 8.649 8.442 0 4.789-3.618 8.476-8.648 8.476-5.03 0-8.65-3.688-8.65-8.476zm12.99 0c0-2.722-1.827-4.65-4.342-4.65-2.514 0-4.341 1.927-4.341 4.65 0 2.757 1.826 4.652 4.341 4.652 2.516 0 4.343-1.895 4.343-4.651h-.001zm6.58 8.098v-9.2c0-4.272 2.722-7.339 7.58-7.339 4.824 0 7.546 3.067 7.546 7.34v9.199H91.66v-8.855c0-2.378-1.068-3.86-3.204-3.86s-3.205 1.482-3.205 3.86v8.855h-4.378zM59.994 17.343h-4.72v6.032c0 2.102.757 3.066 2.928 3.066.207 0 .723 0 1.379-.034v3.549c-.896.241-1.687.379-2.55.379-3.652 0-6.134-2.205-6.134-6.374v-6.618H47.97v-3.48h.73a2.199 2.199 0 0 0 2.198-2.198v-3.28h4.377v5.481h4.72v3.477z"
            />
            {color === 'brand' && (
                <defs>
                    <linearGradient
                        id={`${uid}-a`}
                        x1="3.297"
                        x2="3.297"
                        y1="28.872"
                        y2="19.667"
                        gradientUnits="userSpaceOnUse"
                    >
                        <stop stopColor="#6D4BFD" />
                        <stop offset="1" stopColor="#1C0554" />
                    </linearGradient>
                </defs>
            )}
        </svg>
    ) : (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            xmlnsXlink="http://www.w3.org/1999/xlink"
            viewBox="0 0 36 36"
            width="36"
            height="36"
            fill="none"
            className={clsx(['logo', size && `icon-${size}`, variant, className])}
            aria-labelledby={`${uid}-title`}
            {...rest}
        >
            <title id={`${uid}-title`}>{BRAND_NAME}</title>
            <path
                fill={`url(#${uid}-a)`}
                d="M3.78 26.584v9.36h6.57V26.99a3.285 3.285 0 0 1 3.284-3.285h6.737a11.852 11.852 0 0 0 11.851-11.852A11.851 11.851 0 0 0 20.371 0H3.779v11.7h6.57V6.183h9.577a5.608 5.608 0 1 1 0 11.215h-6.963a9.18 9.18 0 0 0-9.184 9.186z"
            />
            <path
                fill={`url(#${uid}-b)`}
                d="M13.633 23.704a9.853 9.853 0 0 0-9.854 9.853v2.386h6.57V26.99a3.285 3.285 0 0 1 3.284-3.285z"
            />
            <defs>
                <radialGradient
                    id={`${uid}-a`}
                    cx="0"
                    cy="0"
                    r="1"
                    gradientTransform="translate(32.323 -4.99) scale(36.1773)"
                    gradientUnits="userSpaceOnUse"
                >
                    <stop stopColor="#A995FF" />
                    <stop offset="1" stopColor="#6652F5" />
                </radialGradient>
                <linearGradient
                    id={`${uid}-b`}
                    x1="8.706"
                    x2="8.706"
                    y1="34.173"
                    y2="20.419"
                    gradientUnits="userSpaceOnUse"
                >
                    <stop stopColor="#6D4BFD" />
                    <stop offset="1" stopColor="#1C0554" />
                </linearGradient>
            </defs>
        </svg>
    );
};

export default ProtonLogo;
