import React, { useState } from 'react';

import generateUID from '@proton/utils/generateUID';

import LogoBase from '../../logo/LogoBase';

const ReferralDrawerLogo = () => {
    const [uid] = useState(generateUID('referral-logo'));

    return (
        <LogoBase logoWidth={20} logoHeight={20} variant="with-wordmark" uid={uid} focusable="false" aria-hidden="true">
            <g clipPath="url(#clip0_40975_57227)">
                <path
                    d="M13.1843 7.85547C16.1944 7.85547 18.8507 9.8242 19.7263 12.7041L19.7664 12.834C20.2234 14.3373 19.0983 15.8552 17.5271 15.8555H8.84253C7.27114 15.8555 6.14615 14.3374 6.60327 12.834L6.64233 12.7041C7.51796 9.82427 10.1743 7.85556 13.1843 7.85547ZM13.8259 0C15.5611 0 16.9683 1.40651 16.9685 3.1416C16.9685 4.87683 15.5612 6.28418 13.8259 6.28418C12.0908 6.28406 10.6843 4.87676 10.6843 3.1416C10.6845 1.40659 12.0909 0.000116727 13.8259 0Z"
                    fill="url(#paint0_linear_40975_57227)"
                />
                <path d="M1 12.5H13V20.5H1V12.5Z" fill="url(#paint1_linear_40975_57227)" />
                <path d="M0 10.5H14V12.5H0V10.5Z" fill="url(#paint2_linear_40975_57227)" />
                <rect x="6" y="10.5" width="2" height="2" fill="url(#paint3_linear_40975_57227)" />
                <rect x="6" y="12.5" width="2" height="8" fill="url(#paint4_linear_40975_57227)" />
                <path
                    d="M4 8.5C4 7.94772 4.44772 7.5 5 7.5C5.55228 7.5 6 7.94772 6 8.5V9.5H5V10.5H7V8.5C7 7.39543 6.10457 6.5 5 6.5C3.89543 6.5 3 7.39543 3 8.5C3 9.60457 3.89543 10.5 5 10.5V9.5C4.44772 9.5 4 9.05228 4 8.5Z"
                    fill="url(#paint5_linear_40975_57227)"
                />
                <path
                    d="M10 8.5C10 7.94772 9.55228 7.5 9 7.5C8.44772 7.5 8 7.94772 8 8.5V9.5H9V10.5H7V8.5C7 7.39543 7.89543 6.5 9 6.5C10.1046 6.5 11 7.39543 11 8.5C11 9.60457 10.1046 10.5 9 10.5V9.5C9.55228 9.5 10 9.05228 10 8.5Z"
                    fill="url(#paint6_linear_40975_57227)"
                />
                <path d="M1 12.5H6V13.5H1V12.5Z" fill="url(#paint7_linear_40975_57227)" />
                <path d="M6 12.5H8V13.5H6V12.5Z" fill="url(#paint8_linear_40975_57227)" />
                <path d="M8 12.5H13V13.5H8V12.5Z" fill="url(#paint9_linear_40975_57227)" />
            </g>
            <defs>
                <linearGradient
                    id="paint0_linear_40975_57227"
                    x1="16.6912"
                    y1="0.312841"
                    x2="8.8361"
                    y2="12.678"
                    gradientUnits="userSpaceOnUse"
                >
                    <stop stopColor="#EBAAFF" />
                    <stop offset="1" stopColor="#A171FA" />
                </linearGradient>
                <linearGradient
                    id="paint1_linear_40975_57227"
                    x1="1"
                    y1="20.5"
                    x2="3.47423"
                    y2="10.2096"
                    gradientUnits="userSpaceOnUse"
                >
                    <stop stopColor="#FFAB79" />
                    <stop offset="1" stopColor="#FFEBAD" />
                </linearGradient>
                <linearGradient
                    id="paint2_linear_40975_57227"
                    x1="9.17285e-07"
                    y1="12.5"
                    x2="0.139841"
                    y2="9.78588"
                    gradientUnits="userSpaceOnUse"
                >
                    <stop stopColor="#FFC56E" />
                    <stop offset="1" stopColor="#FFF5D5" />
                </linearGradient>
                <linearGradient
                    id="paint3_linear_40975_57227"
                    x1="8.01869"
                    y1="12.5"
                    x2="6.19074"
                    y2="10.3503"
                    gradientUnits="userSpaceOnUse"
                >
                    <stop stopColor="#FF7E62" />
                    <stop offset="1" stopColor="#FFA26D" />
                </linearGradient>
                <linearGradient
                    id="paint4_linear_40975_57227"
                    x1="7"
                    y1="12.5"
                    x2="7"
                    y2="20.5"
                    gradientUnits="userSpaceOnUse"
                >
                    <stop stopColor="#E72A00" />
                    <stop offset="1" stopColor="#FFA26D" />
                </linearGradient>
                <linearGradient
                    id="paint5_linear_40975_57227"
                    x1="6.9717"
                    y1="10.5263"
                    x2="2.78012"
                    y2="6.96685"
                    gradientUnits="userSpaceOnUse"
                >
                    <stop stopColor="#CC3A1A" />
                    <stop offset="1" stopColor="#FFA26D" />
                </linearGradient>
                <linearGradient
                    id="paint6_linear_40975_57227"
                    x1="7"
                    y1="10.5"
                    x2="11.3268"
                    y2="6.89184"
                    gradientUnits="userSpaceOnUse"
                >
                    <stop stopColor="#D33D1C" />
                    <stop offset="0.987787" stopColor="#FFA26D" />
                </linearGradient>
                <linearGradient
                    id="paint7_linear_40975_57227"
                    x1="4.30458"
                    y1="12.5079"
                    x2="4.30458"
                    y2="13.5"
                    gradientUnits="userSpaceOnUse"
                >
                    <stop stopColor="#D44D00" />
                    <stop offset="1" stopColor="#FFD391" stopOpacity="0" />
                </linearGradient>
                <linearGradient
                    id="paint8_linear_40975_57227"
                    x1="7.32183"
                    y1="12.5079"
                    x2="7.32183"
                    y2="13.5"
                    gradientUnits="userSpaceOnUse"
                >
                    <stop stopColor="#6F2800" />
                    <stop offset="1" stopColor="#EA390E" stopOpacity="0" />
                </linearGradient>
                <linearGradient
                    id="paint9_linear_40975_57227"
                    x1="11.3046"
                    y1="12.5079"
                    x2="11.3046"
                    y2="13.5"
                    gradientUnits="userSpaceOnUse"
                >
                    <stop stopColor="#D44D00" />
                    <stop offset="1" stopColor="#FFD391" stopOpacity="0" />
                </linearGradient>
                <clipPath id="clip0_40975_57227">
                    <rect width="20" height="20" fill="white" />
                </clipPath>
            </defs>
        </LogoBase>
    );
};

export default ReferralDrawerLogo;
