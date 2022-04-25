import { ComponentPropsWithoutRef, useState } from 'react';

import { classnames, generateUID } from '@proton/components';
import { VPN_APP_NAME } from '@proton/shared/lib/constants'

import { LogoProps } from './Logo'

type Props = ComponentPropsWithoutRef<'svg'> & Pick<LogoProps, 'variant' | 'size'>;

const VpnLogo = ({ variant = 'with-wordmark', size, className, ...rest }: Props) => {
    // This logo can be several times in the view, ids has to be different each time
    const [uid] = useState(generateUID('logo'));

    const logoWidth = variant === 'with-wordmark' ? 128 : 36;

    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            xmlnsXlink="http://www.w3.org/1999/xlink"
            viewBox={`0 0 ${logoWidth} 36`}
            width={logoWidth}
            height="36"
            fill="none"
            className={classnames(['logo', size && `icon-${size}p`, variant, className])}
            aria-labelledby={`{${uid}}-title`}
            {...rest}
        >
            {variant === 'with-wordmark' && (
                <g>
                    <path
                        className="logo-text-product"
                        d="M111.69 12.07H106V24.4h2.26v-3.07a1.13 1.13 0 011.12-1.12h2.31a4.05 4.05 0 004.05-4.06 4.04 4.04 0 00-1.18-2.87 4.06 4.06 0 00-2.87-1.2zm1.77 4.04a1.92 1.92 0 01-.56 1.36 1.9 1.9 0 01-1.36.56h-3.3V14.2h3.3a1.92 1.92 0 011.92 1.94zM98.1 24.34l-4.54-12.3h2.57l2.98 8.8c.12.32.2.64.26.98h.02c.04-.34.12-.67.25-.98l3-8.8h2.58l-4.56 12.3zm18.5 0v-12.3h1.97l5.81 7.63c.21.26.4.55.54.85h.04a10.43 10.43 0 01-.06-1.12v-7.36h2.33v12.3h-1.97l-5.83-7.63a5.45 5.45 0 01-.54-.85h-.02c.03.37.04.75.04 1.12v7.36z"
                    />
                    <path
                        className="logo-text-proton"
                        d="M48.69 12H43v12.32h2.25v-3.07a1.13 1.13 0 011.13-1.13h2.3a4.05 4.05 0 004.06-4.05A4.05 4.05 0 0048.69 12zm1.77 4.04a1.92 1.92 0 01-1.92 1.92h-3.3v-3.84h3.3a1.92 1.92 0 011.92 1.93zm2.63 8.28v-4.88c0-2 1.17-3.58 3.5-3.58a4.47 4.47 0 011.11.12v2l-.6-.01c-1.23 0-1.77.56-1.77 1.71v4.64zm5.28-4.14a4.26 4.26 0 014.43-4.32c2.58 0 4.43 1.87 4.43 4.32s-1.86 4.34-4.43 4.34a4.27 4.27 0 01-4.43-4.34zm6.65 0c0-1.4-.93-2.39-2.22-2.39s-2.22 1-2.22 2.39c0 1.39.93 2.38 2.22 2.38s2.22-.97 2.22-2.38zm8.7-2.37H71.3v3.09c0 1.08.4 1.57 1.5 1.57.1 0 .37 0 .7-.02v1.82a4.95 4.95 0 01-1.3.2c-1.87 0-3.14-1.14-3.14-3.27V17.8h-1.5v-1.77h.38a1.13 1.13 0 001.12-1.13v-1.69h2.24v2.8h2.42v1.79zm.67 2.37a4.26 4.26 0 014.43-4.32c2.57 0 4.43 1.87 4.43 4.32s-1.86 4.34-4.43 4.34-4.43-1.9-4.43-4.34zm6.65 0c0-1.4-.93-2.39-2.22-2.39s-2.22 1-2.22 2.39c0 1.39.93 2.38 2.22 2.38s2.22-.97 2.22-2.38zm3.37 4.14V19.6c0-2.19 1.4-3.76 3.88-3.76s3.87 1.58 3.87 3.76v4.71h-2.23V19.8c0-1.22-.54-1.98-1.64-1.98s-1.64.76-1.64 1.98v4.53z"
                    />
                </g>
            )}
            {(variant === 'with-wordmark' || variant === 'standalone') && (
                <g>
                    <path
                        className="logo-mark-background"
                        d="M1 9a8 8 0 018-8h18a8 8 0 018 8v18a8 8 0 01-8 8H9a8 8 0 01-8-8z"
                    />
                    <path
                        className="logo-mark-border"
                        d="M9 .5A8.5 8.5 0 00.5 9v18A8.5 8.5 0 009 35.5h18a8.5 8.5 0 008.5-8.5V9A8.5 8.5 0 0027 .5z"
                    />
                </g>
            )}
            <g fillRule="evenodd" clipRule="evenodd">
                <path
                    fill="#6d4aff"
                    d="M16 26.85a2.22 2.22 0 003.8.15l8.54-13.02c.91-1.38.04-3.23-1.6-3.42L9.95 8.63a2.22 2.22 0 00-2.2 3.28z"
                />
                <path
                    fill={`url(#${uid}-a)`}
                    d="M16 26.85a2.22 2.22 0 003.8.15l8.54-13.02c.91-1.38.04-3.23-1.6-3.42L9.95 8.63a2.22 2.22 0 00-2.2 3.28z"
                />
                <path
                    fill={`url(#${uid}-b)`}
                    d="M17.25 24.35l-.76 1.14a.74.74 0 01-1.26-.05l.78 1.41c.14.26.31.47.51.64.97.8 2.52.66 3.28-.5l8.54-13.01c.91-1.38.04-3.23-1.6-3.42L9.95 8.63a2.22 2.22 0 00-2.2 3.28l.08.12 14.29 1.65a1.23 1.23 0 01.89 1.9z"
                />
            </g>
            <defs>
                <linearGradient
                    id={`${uid}-a`}
                    x1="19.29"
                    x2="13.28"
                    y1=".28"
                    y2="26.12"
                    gradientUnits="userSpaceOnUse"
                >
                    <stop offset=".48" stopColor="#24ecc6" stopOpacity="0" />
                    <stop offset=".99" stopColor="#24ecc6" />
                </linearGradient>
                <linearGradient
                    id={`${uid}-b`}
                    x1="21.27"
                    x2="7.96"
                    y1="28.95"
                    y2="6.19"
                    gradientUnits="userSpaceOnUse"
                >
                    <stop offset=".07" stopColor="#abffef" />
                    <stop offset=".45" stopColor="#cac9ff" />
                    <stop offset="1" stopColor="#6d4aff" />
                </linearGradient>
            </defs>
            <title id={`{${uid}}-title`}>{VPN_APP_NAME}</title>
        </svg>
    );
};

export default VpnLogo;
