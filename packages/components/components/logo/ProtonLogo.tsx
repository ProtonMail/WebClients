import { ComponentPropsWithoutRef, useState } from 'react';
import { classnames, generateUID } from '@proton/components';
import { BRAND_NAME } from '@proton/shared/lib/constants';

type Version = 'full' | 'glyph-only';

interface Props extends ComponentPropsWithoutRef<'svg'> {
    version?: Version;
}

const ProtonLogo = ({ version = 'full', className, ...rest }: Props) => {
    // This logo can be several times in the view, ids has to be different each time
    const [uid] = useState(generateUID('logo'));

    return version === 'full' ? (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            xmlnsXlink="http://www.w3.org/1999/xlink"
            viewBox="0 0 96 36"
            width="96"
            height="36"
            fill="none"
            className={classnames(['logo', version, className])}
            aria-labelledby={`{${uid}}-title`}
            {...rest}
        >
            <path
                fill="#6D4AFF"
                d="M0 23.474v6.152h4.319v-5.885a2.16 2.16 0 0 1 2.159-2.16h4.428a7.79 7.79 0 0 0 7.79-7.79A7.79 7.79 0 0 0 10.907 6H0v7.69h4.319v-3.626h6.295A3.686 3.686 0 0 1 14.3 13.75a3.686 3.686 0 0 1-3.686 3.686H6.037A6.038 6.038 0 0 0 0 23.474zm19.363 6.151V20.25c0-3.824 2.233-6.87 6.7-6.87a8.576 8.576 0 0 1 2.13.237v3.858c-.508-.034-.946-.034-1.15-.034-2.367 0-3.384 1.083-3.384 3.283v8.899h-4.296zm10.117-7.95c0-4.703 3.554-8.29 8.494-8.29 4.942 0 8.494 3.587 8.494 8.29 0 4.704-3.553 8.325-8.494 8.325-4.94 0-8.493-3.622-8.493-8.325zm12.758 0c0-2.673-1.794-4.568-4.264-4.568S33.71 19 33.71 21.675c0 2.707 1.794 4.569 4.264 4.569 2.471 0 4.264-1.862 4.264-4.569zm17.967 0c0-4.703 3.553-8.29 8.494-8.29s8.494 3.587 8.494 8.29c0 4.704-3.553 8.325-8.494 8.325-4.94 0-8.494-3.622-8.494-8.325zm12.758 0c0-2.673-1.794-4.568-4.264-4.568S64.435 19 64.435 21.675c0 2.707 1.794 4.569 4.264 4.569s4.265-1.862 4.265-4.569h-.001zm6.465 7.952v-9.034c0-4.197 2.673-7.208 7.444-7.208 4.738 0 7.411 3.011 7.411 7.208v9.034h-4.261v-8.696c0-2.335-1.05-3.79-3.147-3.79-2.098 0-3.148 1.455-3.148 3.79v8.696h-4.3zM58.921 17.14h-4.636v5.924c0 2.064.745 3.01 2.877 3.01.203 0 .71 0 1.353-.033v3.486c-.88.236-1.656.372-2.504.372-3.587 0-6.023-2.166-6.023-6.26v-6.5H47.11v-3.417h.717a2.16 2.16 0 0 0 2.16-2.16v-3.22h4.297v5.383h4.636v3.414z"
            />
            <title id={`{${uid}}-title`}>{BRAND_NAME}</title>
        </svg>
    ) : (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            xmlnsXlink="http://www.w3.org/1999/xlink"
            viewBox="0 0 36 36"
            width="36"
            height="36"
            fill="none"
            className={classnames(['logo', version, className])}
            aria-labelledby={`{${uid}}-title`}
            {...rest}
        >
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
            <title id={`{${uid}}-title`}>{BRAND_NAME}</title>
        </svg>
    );
};

export default ProtonLogo;
