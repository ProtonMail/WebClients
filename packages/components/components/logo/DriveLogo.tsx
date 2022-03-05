import { ComponentPropsWithoutRef, useState } from 'react';

import { classnames, generateUID } from '@proton/components';
import { APPS } from '@proton/shared/lib/constants';
import { getAppName } from '@proton/shared/lib/apps/helper';

import { LogoProps } from './Logo';

type Props = ComponentPropsWithoutRef<'svg'> & Pick<LogoProps, 'variant' | 'size'>;

const DriveLogo = ({ variant = 'with-wordmark', size, className, ...rest }: Props) => {
    const appName = getAppName(APPS.PROTONDRIVE);

    // This logo can be several times in the view, ids has to be different each time
    const [uid] = useState(generateUID('logo'));

    const logoWidth = variant === 'with-wordmark' ? 134 : 36;

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
                        d="M103.26 13.14a5.9 5.9 0 012.25 2.21 6.41 6.41 0 010 6.23 5.88 5.88 0 01-2.25 2.23 6.58 6.58 0 01-3.3.81h-4.04v-12.3h4.05a6.58 6.58 0 013.29.82zm-3.16 9.3a3.74 3.74 0 003.36-1.97 4.28 4.28 0 000-4 3.72 3.72 0 00-3.35-1.95h-1.88v7.9l1.88.01zm7.23-2.82a3.77 3.77 0 01.93-2.63 3.41 3.41 0 012.63-1.02c.39 0 .77.04 1.14.13v2.05l-.61-.01c-.63 0-1.08.14-1.37.43a1.8 1.8 0 00-.43 1.31v4.74h-2.28l-.01-5zm5.63-5.23a1.3 1.3 0 01-.42-.98 1.34 1.34 0 01.42-1 1.4 1.4 0 011.01-.41 1.38 1.38 0 011 .42 1.33 1.33 0 01.42.99 1.3 1.3 0 01-.42.98 1.4 1.4 0 01-1 .4 1.4 1.4 0 01-1.01-.4zm2.15 10.22h-2.27v-8.47h2.27v8.47zm3.66 0l-3.23-8.47h2.4l1.48 4.33.4 1.37h.03c.1-.41.25-.87.41-1.37l1.48-4.33h2.41l-3.22 8.47h-2.16zm13.74-3.46h-6.39c.1.51.38.98.78 1.3.4.32.9.48 1.4.47a2.91 2.91 0 001.2-.2c.29-.15.53-.38.69-.68h2.1a3.48 3.48 0 01-1.47 2.05 4.43 4.43 0 01-2.47.7 4.56 4.56 0 01-2.3-.56 3.95 3.95 0 01-1.55-1.57 4.7 4.7 0 01-.55-2.28 4.61 4.61 0 01.56-2.28 4.01 4.01 0 011.55-1.57 4.41 4.41 0 012.24-.56 4.2 4.2 0 012.18.58 4.05 4.05 0 011.52 1.59c.37.69.56 1.46.55 2.25 0 .25-.01.5-.04.76zm-5.63-2.83c-.4.32-.66.76-.78 1.25h4.3a1.9 1.9 0 00-.7-1.23 2.15 2.15 0 00-1.4-.48 2.19 2.19 0 00-1.42.46z"
                    />
                    <path
                        className="logo-text-proton"
                        d="M48.68 12.3H43v12.29h2.25v-3.05a1.12 1.12 0 011.12-1.12h2.3a4.05 4.05 0 004.05-4.05 4.05 4.05 0 00-4.04-4.08zm1.77 4.04a1.92 1.92 0 01-1.93 1.91h-3.27v-3.84h3.27a1.92 1.92 0 011.92 1.92v.01zm2.63 8.25v-4.88c0-1.99 1.16-3.57 3.48-3.57.38 0 .75.03 1.11.12v2h-.6c-1.23 0-1.76.55-1.76 1.7v4.63h-2.23zm5.27-4.14a4.25 4.25 0 014.42-4.31c2.58 0 4.41 1.86 4.41 4.31a4.26 4.26 0 01-4.42 4.33 4.26 4.26 0 01-4.4-4.33zm6.64 0c0-1.39-.93-2.38-2.22-2.38-1.28 0-2.22.99-2.22 2.38s.94 2.38 2.22 2.38c1.3 0 2.21-.97 2.21-2.38H65zm8.67-2.36h-2.4v3.08c0 1.08.38 1.57 1.49 1.57.1 0 .37 0 .7-.02v1.82c-.42.12-.86.19-1.3.19-1.87 0-3.13-1.13-3.13-3.26V18.1h-1.5v-1.77h.37a1.12 1.12 0 001.13-1.12V13.5h2.23v2.8h2.42v1.78zm.67 2.36a4.25 4.25 0 014.42-4.31 4.25 4.25 0 014.42 4.31 4.26 4.26 0 01-4.42 4.33 4.26 4.26 0 01-4.42-4.33zm6.64 0c0-1.39-.93-2.38-2.22-2.38-1.28 0-2.22.99-2.22 2.38s.94 2.38 2.22 2.38c1.29 0 2.22-.97 2.22-2.38zm3.36 4.14v-4.7c0-2.19 1.4-3.75 3.88-3.75s3.86 1.56 3.86 3.75v4.7h-2.22v-4.53c0-1.21-.55-1.97-1.64-1.97-1.1 0-1.64.76-1.64 1.97v4.53h-2.24z"
                    />
                </g>
            )}
            {(variant === 'with-wordmark' || variant === 'standalone') && (
                <g>
                    <path
                        className="logo-mark-background"
                        d="M1 9a8 8 0 018-8h18a8 8 0 018 8v18a8 8 0 01-8 8H9a8 8 0 01-8-8V9z"
                    />
                    <path
                        className="logo-mark-border"
                        d="M9 .5A8.5 8.5 0 00.5 9v18A8.5 8.5 0 009 35.5h18a8.5 8.5 0 008.5-8.5V9A8.5 8.5 0 0027 .5H9z"
                    />
                </g>
            )}
            <g>
                <path
                    fill={`url(#${uid}-a)`}
                    d="M7.28 24.65v-13.3c0-1.23 1-2.22 2.22-2.22h4.16c.42 0 .83.13 1.17.38l1.39 1.02c.34.25.74.39 1.16.39h9.12c1.22 0 2.22.99 2.22 2.21v11.52a2.22 2.22 0 01-2.22 2.22h-17a2.22 2.22 0 01-2.22-2.22z"
                />
                <path
                    fill={`url(#${uid}-b)`}
                    d="M7.28 24.65v-13.3c0-1.23 1-2.22 2.22-2.22h4.16c.42 0 .83.13 1.17.38l1.39 1.02c.34.25.74.39 1.16.39h9.12c1.22 0 2.22.99 2.22 2.21v11.52a2.22 2.22 0 01-2.22 2.22h-17a2.22 2.22 0 01-2.22-2.22z"
                />
                <path
                    fill={`url(#${uid}-c)`}
                    fillRule="evenodd"
                    d="M17.38 10.92h9.12c1.22 0 2.22.99 2.22 2.21v11.52a2.22 2.22 0 01-2.22 2.22h-2.34V15.3c0-.96-.78-1.73-1.74-1.72l-8.39.05a1.72 1.72 0 01-1.01-.33l-1.87-1.33a1.73 1.73 0 00-1-.31H7.28v-.31c0-1.23 1-2.22 2.22-2.22h4.16c.42 0 .83.13 1.17.38l1.39 1.02c.34.25.74.39 1.16.39z"
                    clipRule="evenodd"
                />
            </g>
            <defs>
                <linearGradient
                    id={`${uid}-a`}
                    x1="18.02"
                    x2="19.68"
                    y1=".15"
                    y2="23.53"
                    gradientUnits="userSpaceOnUse"
                >
                    <stop offset=".99" stopColor="#6D4AFF" />
                </linearGradient>
                <linearGradient id={`${uid}-c`} x1=".08" x2="26.87" y1="6.17" y2="35.62" gradientUnits="userSpaceOnUse">
                    <stop stopColor="#6D4AFF" />
                    <stop offset=".36" stopColor="#AE8CFF" />
                    <stop offset="1" stopColor="#F8CCFF" />
                </linearGradient>
                <radialGradient
                    id={`${uid}-b`}
                    cx="0"
                    cy="0"
                    r="1"
                    gradientTransform="matrix(-13.5868 27.76355 -43.19393 -21.13806 24.87 1.35)"
                    gradientUnits="userSpaceOnUse"
                >
                    <stop offset=".56" stopColor="#FF62C0" stopOpacity="0" />
                    <stop offset=".99" stopColor="#FF62C0" />
                </radialGradient>
            </defs>
            <title id={`{${uid}}-title`}>{appName}</title>
        </svg>
    );
};

export default DriveLogo;
