import { ComponentPropsWithoutRef, useState } from 'react';

import { MAIL_APP_NAME } from '@proton/shared/lib/constants'
import { classnames, generateUID } from '@proton/components';

import { LogoProps } from './Logo';

type Props = ComponentPropsWithoutRef<'svg'> & Pick<LogoProps, 'variant' | 'size'>;

const MailLogo = ({ variant = 'with-wordmark', className, size, ...rest }: Props) => {
    // This logo can be several times in the view, ids has to be different each time
    const [uid] = useState(generateUID('logo'));

    const logoWidth = variant === 'with-wordmark' ? 130 : 36;

    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            xmlnsXlink="http://www.w3.org/1999/xlink"
            viewBox={`0 0 ${logoWidth} 36`}
            width={logoWidth}
            height="36"
            fill="none"
            className={classnames(['logo', size && `icon-${size}p`, variant, className])}
            aria-labelledby={`${uid}-title`}
            {...rest}
        >
            {variant === 'with-wordmark' && (
                <g>
                    <path
                        className="logo-text-product"
                        d="M95.88 24.6V12.33h3.19l2.99 7.36c.26.61.5 1.25.68 1.89h.03a17.83 17.83 0 01.69-1.9l2.98-7.35h3.2V24.6h-2.32v-8.22a7.09 7.09 0 01.04-.81h-.04c-.07.29-.17.57-.29.84l-3.3 8.05h-1.92l-3.32-8.05a7.18 7.18 0 01-.3-.84h-.04c.03.27.04.54.04.8v8.23h-2.3zm21.65-8.1c.67.36 1.22.9 1.6 1.55.4.72.6 1.52.58 2.34v4.21h-2.03l-.14-1.26a2.83 2.83 0 01-1.12 1.08c-.5.26-1.05.4-1.62.38a3.88 3.88 0 01-2.04-.56 4 4 0 01-1.47-1.56 4.82 4.82 0 01-.54-2.3 4.41 4.41 0 01.59-2.26 4.22 4.22 0 011.61-1.58 4.58 4.58 0 012.27-.58 4.81 4.81 0 012.31.54zm-.74 5.67c.44-.42.66-1 .66-1.8a2.46 2.46 0 00-.63-1.75 2.2 2.2 0 00-1.59-.68 2.2 2.2 0 00-1.59.68 2.73 2.73 0 000 3.5 2.1 2.1 0 001.6.68 2.16 2.16 0 001.55-.63zm4.16-7.78a1.32 1.32 0 01-.32-.45 1.31 1.31 0 01-.1-.53 1.34 1.34 0 01.42-1 1.43 1.43 0 012.02 0 1.33 1.33 0 01.43 1 1.31 1.31 0 01-.43.98 1.46 1.46 0 01-2.02 0zm2.15 10.21h-2.27v-8.46h2.27v8.46zm3.94 0h-2.28V12.33h2.27V24.6z"
                    />
                    <path
                        className="logo-text-proton"
                        d="M48.67 12.3H43v12.28h2.25v-3.05a1.12 1.12 0 011.12-1.12h2.3a4.04 4.04 0 004.04-4.04 4.04 4.04 0 00-4.04-4.08zm1.77 4.04a1.92 1.92 0 01-1.92 1.9h-3.29v-3.83h3.29a1.92 1.92 0 011.92 1.92v.01zm2.63 8.24v-4.87c0-2 1.16-3.58 3.48-3.58.38 0 .75.04 1.11.13v2l-.6-.01c-1.23 0-1.76.56-1.76 1.7v4.63h-2.23zm5.26-4.13a4.25 4.25 0 014.42-4.32 4.24 4.24 0 014.41 4.32c0 2.45-1.84 4.33-4.41 4.33s-4.42-1.89-4.42-4.33zm6.64 0c0-1.4-.94-2.38-2.22-2.38s-2.22.99-2.22 2.38.93 2.37 2.22 2.37 2.22-.96 2.22-2.37zm8.67-2.36h-2.41v3.08c0 1.07.39 1.56 1.5 1.56l.7-.01v1.8c-.42.13-.86.2-1.3.2-1.87 0-3.14-1.12-3.14-3.25v-3.38H67.5v-1.77h.37A1.12 1.12 0 0069 15.2V13.5h2.24v2.8h2.4v1.78zm.67 2.36a4.25 4.25 0 014.41-4.32 4.24 4.24 0 014.42 4.32 4.26 4.26 0 01-4.42 4.33 4.26 4.26 0 01-4.41-4.33zm6.63 0c0-1.4-.93-2.38-2.22-2.38-1.28 0-2.21.99-2.21 2.38s.93 2.37 2.21 2.37c1.29 0 2.22-.96 2.22-2.37zm3.36 4.13v-4.7c0-2.18 1.4-3.74 3.87-3.74s3.86 1.56 3.86 3.74v4.7H89.8v-4.52c0-1.22-.54-1.97-1.64-1.97-1.09 0-1.63.76-1.63 1.97v4.52H84.3z"
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
                    fill="#6D4AFF"
                    d="M7.28 10.18a.5.5 0 01.81-.38l8.5 7.05a2.22 2.22 0 002.83 0L27.9 9.8a.5.5 0 01.8.38v14.47a2.22 2.22 0 01-2.2 2.22h-17a2.22 2.22 0 01-2.23-2.22V10.18z"
                />
                <path
                    fill={`url(#${uid}-a)`}
                    fillRule="evenodd"
                    d="M20.9 15.63l-4.28 3.77a1.97 1.97 0 01-2.57.04l-6.77-5.63v-3.63a.5.5 0 01.81-.38l8.5 7.05a2.22 2.22 0 002.83 0l1.47-1.22z"
                    clipRule="evenodd"
                />
                <path
                    fill={`url(#${uid}-b)`}
                    fillRule="evenodd"
                    d="M24.16 12.92v13.95h2.34a2.22 2.22 0 002.22-2.22V10.18a.5.5 0 00-.8-.38l-3.76 3.12z"
                    clipRule="evenodd"
                />
            </g>
            <defs>
                <linearGradient
                    id={`${uid}-a`}
                    x1="23.45"
                    x2="18.57"
                    y1="18.09"
                    y2="-2.77"
                    gradientUnits="userSpaceOnUse"
                >
                    <stop stopColor="#E2DBFF" />
                    <stop offset="1" stopColor="#6D4AFF" />
                </linearGradient>
                <linearGradient
                    id={`${uid}-b`}
                    x1="35.25"
                    x2="18.57"
                    y1="38.17"
                    y2="2.55"
                    gradientUnits="userSpaceOnUse"
                >
                    <stop offset=".27" stopColor="#E2DBFF" />
                    <stop offset="1" stopColor="#6D4AFF" />
                </linearGradient>
            </defs>
            <title id={`${uid}-title`}>{MAIL_APP_NAME}</title>
        </svg>
    );
};

export default MailLogo;
