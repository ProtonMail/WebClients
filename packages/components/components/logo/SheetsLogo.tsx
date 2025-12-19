import { useState } from 'react';

import { SHEETS_APP_NAME } from '@proton/shared/lib/constants';
import generateUID from '@proton/utils/generateUID';

import LogoBase, { type LogoProps } from './LogoBase';

const SheetsLogo = ({ variant = 'with-wordmark', hasTitle = true, ...rest }: LogoProps) => {
    const [uid] = useState(generateUID('logo'));

    let logoWidth: number;
    const logoHeight = 36;

    switch (variant) {
        case 'glyph-only':
            logoWidth = 36;
            break;
        case 'wordmark-only':
            logoWidth = 245;
            break;
        default:
            logoWidth = 142;
            break;
    }
    return (
        <LogoBase
            uid={uid}
            logoWidth={logoWidth}
            logoHeight={logoHeight}
            title={hasTitle ? SHEETS_APP_NAME : undefined}
            variant={variant}
            {...rest}
        >
            <path
                d="M4.00008 8.66666C4.00008 6.08933 6.08942 4 8.66674 4H27.3334C29.9107 4 32.0001 6.08934 32.0001 8.66666V27.3333C32.0001 29.9106 29.9107 32 27.3334 32H8.66674C6.08941 32 4.00008 29.9106 4.00008 27.3333V8.66666Z"
                fill={`url(#${uid}-a)`}
            />
            <path
                fillRule="evenodd"
                clipRule="evenodd"
                d="M12.475 15.6972C13.1244 15.6972 13.651 16.2237 13.651 16.8732L13.651 26.8412C13.651 27.4907 13.1244 28.0172 12.475 28.0172C11.8255 28.0172 11.299 27.4907 11.299 26.8412L11.299 16.8732C11.299 16.2237 11.8255 15.6972 12.475 15.6972Z"
                fill="white"
            />
            <path
                fillRule="evenodd"
                clipRule="evenodd"
                d="M7.37897 23.3692C7.37897 22.7197 7.90548 22.1932 8.55496 22.1932L19.643 22.1932C20.2924 22.1932 20.819 22.7197 20.819 23.3692C20.819 24.0187 20.2924 24.5452 19.643 24.5452L8.55496 24.5452C7.90548 24.5452 7.37897 24.0187 7.37897 23.3692Z"
                fill="white"
            />
            <path d="M18.0001 3.99998H25.0001V11H18.0001V3.99998Z" fill="white" fillOpacity="0.5" />
            <path
                d="M24.9997 3.99998H27.333C29.9103 3.99998 31.9997 6.08932 31.9997 8.66665V11H24.9997V3.99998Z"
                fill="white"
                fillOpacity="0.8"
            />
            <path d="M24.9997 11H31.9997V18H24.9997V11Z" fill="white" fillOpacity="0.5" />
            <defs>
                <radialGradient
                    id={`${uid}-a`}
                    cx="0"
                    cy="0"
                    r="1"
                    gradientUnits="userSpaceOnUse"
                    gradientTransform="translate(2.06388 37.5918) rotate(-53.1504) scale(33.0407)"
                >
                    <stop stopColor="#1B854C" />
                    <stop offset="1" stopColor="#26DA79" />
                </radialGradient>
            </defs>
        </LogoBase>
    );
};

export default SheetsLogo;
