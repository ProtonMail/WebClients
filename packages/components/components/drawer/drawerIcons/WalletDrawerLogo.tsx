import { useState } from 'react';

import generateUID from '@proton/utils/generateUID';

import LogoBase from '../../logo/LogoBase';

const WalletDrawerLogo = () => {
    const [uid] = useState(generateUID('wallet-logo'));

    return (
        <LogoBase logoWidth={28} logoHeight={28} variant="with-wordmark" uid={uid} focusable="false" aria-hidden="true">
            <defs>
                <linearGradient
                    id="paint0_linear_3283_254"
                    x1="-2.61077"
                    y1="2.09483"
                    x2="23.1247"
                    y2="12.1198"
                    gradientUnits="userSpaceOnUse"
                >
                    <stop stopColor="#957AFD" />
                    <stop offset="1" stopColor="#FFC6C6" />
                </linearGradient>
                <linearGradient
                    id="paint1_linear_3283_254"
                    x1="15.446"
                    y1="5.06313"
                    x2="7.45658"
                    y2="21.297"
                    gradientUnits="userSpaceOnUse"
                >
                    <stop offset="0.1499" stopColor="#FA528E" stopOpacity="0" />
                    <stop offset="0.7208" stopColor="#FF8065" />
                    <stop offset="1" stopColor="#FFA51F" />
                </linearGradient>
            </defs>
            <mask id="mask0_3283_254" maskUnits="userSpaceOnUse" x="0" y="0" width="21" height="18">
                <path
                    fillRule="evenodd"
                    clipRule="evenodd"
                    d="M3.79793e-05 18L3.78407e-05 15.1619L4.33916 15.1619C5.90282 15.1619 7.17073 13.8072 7.17073 12.1366C7.17073 10.4659 5.90282 9.11122 4.33916 9.11122H3.75452e-05L3.71002e-05 0H20.8047V18L3.79793e-05 18ZM3.75452e-05 9.11122H5.28968e-07L0 15.1619H3.78407e-05L3.75452e-05 9.11122ZM5.73081 12.1463C5.73081 11.2573 5.0101 10.5366 4.12106 10.5366C3.23201 10.5366 2.5113 11.2573 2.5113 12.1463C2.5113 13.0354 3.23201 13.7561 4.12106 13.7561C5.0101 13.7561 5.73081 13.0354 5.73081 12.1463Z"
                    fill="white"
                />
            </mask>
            <g mask="url(#mask0_3283_254)" transform="matrix(1, 0, 0, 1, 4.003907203674316, 5)">
                <path
                    d="M2.06506 18C0.922399 18 -0.00390619 17.0737 -0.00390625 15.931L-0.00390693 2.06896C-0.00390698 0.926307 0.9224 4.46994e-08 2.06506 0L12.5281 0C17.0987 -1.78798e-07 20.8039 3.70523 20.8039 8.27586L20.8039 15.931C20.8039 17.0737 19.8776 18 18.735 18H2.06506Z"
                    fill="url(#paint0_linear_3283_254)"
                />
                <path
                    d="M2.06897 18C0.92631 18 7.00656e-07 17.0737 6.44063e-07 15.931L0 2.74902L10.1653 2.74902C13.5933 2.74902 16.3722 5.52795 16.3722 8.95592V18L2.06897 18Z"
                    fill="#6D4AFF"
                />
                <path
                    d="M2.06897 18C0.92631 18 7.00656e-07 17.0737 6.44063e-07 15.931L0 2.74902L10.1653 2.74902C13.5933 2.74902 16.3722 5.52795 16.3722 8.95592V18L2.06897 18Z"
                    fill="url(#paint1_linear_3283_254)"
                    fillOpacity="0.9"
                />
                <path
                    d="M3.11318 18.0024L6.4624 14.1975L0.0233765 15.0024L0 16C0 17.2855 0.71451 18 2 18L3.11318 18.0024Z"
                    fill="#FFBB93"
                />
            </g>
        </LogoBase>
    );
};

export default WalletDrawerLogo;
