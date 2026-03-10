import { useState } from 'react';

import { c } from 'ttag';

import { Href } from '@proton/atoms/Href/Href';
import { MailLogo, QRCode } from '@proton/components/index';
import { BRAND_NAME } from '@proton/shared/lib/constants';
import generateUID from '@proton/utils/generateUID';

import { getActivationUrl } from '../helpers/emailReservationHelpers';

import './VoucherDisplay.scss';

export interface VoucherDisplayProps {
    reservedEmail: string;
    activationCode: string;
}

const VoucherDisplay = ({ reservedEmail, activationCode }: VoucherDisplayProps) => {
    const activationUrl = getActivationUrl(reservedEmail, activationCode);
    const [uid] = useState(generateUID('voucher'));

    return (
        <div className="w-full h-full flex items-center justify-center relative">
            {/* eslint-disable-next-line jsx-a11y/prefer-tag-over-role */}
            <svg
                xmlns="http://www.w3.org/2000/svg"
                role="img"
                width="464"
                height="650"
                viewBox="0 0 464 650"
                fill="none"
                aria-labelledby={`title-svg-${uid} desc-svg-${uid} to-activate-svg-${uid} activation-code-svg-${uid}`}
            >
                <title id={`title-svg-${uid}`}>{c('Heading').t`Address reservation voucher`}</title>
                <desc id={`desc-svg-${uid}`}>
                    <span>{c('Info')
                        .jt`Your voucher for your reserved ${BRAND_NAME} email address: ${reservedEmail}`}</span>
                </desc>
                <g filter={`url(#${uid}-a)`}>
                    <rect width="446" height="631.146" x="8.995" y="5.997" fill="#fff" rx="18" />
                    <rect width="446" height="631.146" x="8.995" y="5.997" fill={`url(#${uid}-b)`} rx="18" />
                    <rect
                        width="446"
                        height="631.146"
                        x="8.995"
                        y="5.997"
                        fill={`url(#${uid}-c)`}
                        fillOpacity=".1"
                        rx="18"
                    />
                    <path
                        fill={`url(#${uid}-d)`}
                        d="M74.646 212.566a188.88 188.88 0 0 1 144.567 4.997l130.397 59.351a115.39 115.39 0 0 0 105.385-5.035v149.774a243.8 243.8 0 0 1-66.354 6.847 243.85 243.85 0 0 1-92.621-21.762L169.87 349.32a67.59 67.59 0 0 0-89.515 33.517L8.995 539.62V254.257q1.47-1.434 2.97-2.837a188.9 188.9 0 0 1 62.68-38.854"
                    />
                    <path
                        fill={`url(#${uid}-e)`}
                        d="M14.777 343.932a202.7 202.7 0 0 1 155.071 5.349 67.583 67.583 0 0 0-89.481 33.532L8.995 539.622V346.199a203 203 0 0 1 5.782-2.267"
                    />
                </g>
                <foreignObject x="0" y="0" width="464" height="650">
                    <div className="w-full h-full flex items-center justify-center">
                        <div className="flex items-center justify-center text-center voucher-container">
                            <div className="text-center voucher-inner-container">
                                <div className="w-full h-full flex items-center justify-center mb-8">
                                    <MailLogo variant="with-wordmark" hasTitle={false} />
                                </div>
                                <p className="voucher-color-text text-wrap-balance text-sm">{c('Label')
                                    .t`Your voucher for your reserved ${BRAND_NAME} email address:`}</p>
                                <div className="voucher-email block px-4 py-3">
                                    <span className="voucher-email-text voucher-color-text text-break">
                                        {reservedEmail}
                                    </span>
                                </div>

                                <div className="mt-8">
                                    <QRCode color="#2C1E66" value={activationUrl} size={88} />
                                </div>

                                <div
                                    className="text-wrap-balance text-xs text-center voucher-color-text mt-2 mb-1"
                                    id={`to-activate-svg-${uid}`}
                                >
                                    <span className="text-semibold">{c('Label')
                                        .t`To activate, scan the QR-code or go to:`}</span>
                                    <Href
                                        className="text-decoration color-inherit ml-0.5"
                                        href="https://account.proton.me/born-private/activate"
                                    >
                                        account.proton.me/born-private/activate
                                    </Href>
                                </div>

                                <div
                                    className="inline-flex flex-row items-center gap-1 text-xs text-center voucher-color-text"
                                    id={`activation-code-svg-${uid}`}
                                >
                                    <span className="text-semibold">{c('Label').t`Your activation code:`}</span>
                                    <span className="text-pre">{activationCode}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </foreignObject>
                <defs>
                    <radialGradient
                        id={`${uid}-b`}
                        cx="0"
                        cy="0"
                        r="1"
                        gradientTransform="matrix(199.763 0 0 290.912 8.995 309.406)"
                        gradientUnits="userSpaceOnUse"
                    >
                        <stop stopColor="#6d4aff" stopOpacity=".4" />
                        <stop offset="1" stopColor="#bcabff" stopOpacity="0" />
                    </radialGradient>
                    <radialGradient
                        id={`${uid}-c`}
                        cx="0"
                        cy="0"
                        r="1"
                        gradientTransform="matrix(0 209.508 -176.276 0 454.995 308.827)"
                        gradientUnits="userSpaceOnUse"
                    >
                        <stop stopColor="#ff0004" stopOpacity=".5" />
                        <stop offset="1" stopColor="#ff8d8f" stopOpacity="0" />
                    </radialGradient>
                    <radialGradient
                        id={`${uid}-d`}
                        cx="0"
                        cy="0"
                        r="1"
                        gradientTransform="matrix(107.465 378.469 -784.36 -103.886 154.414 31.369)"
                        gradientUnits="userSpaceOnUse"
                    >
                        <stop stopColor="#a995ff" />
                        <stop offset="1" stopColor="#6652f5" />
                    </radialGradient>
                    <linearGradient
                        id={`${uid}-e`}
                        x1="-11.637"
                        x2="105.59"
                        y1="503.331"
                        y2="245.774"
                        gradientUnits="userSpaceOnUse"
                    >
                        <stop stopColor="#6d4bfd" />
                        <stop offset="1" stopColor="#1c0554" />
                    </linearGradient>
                    <filter
                        id={`${uid}-a`}
                        width="463.99"
                        height="649.136"
                        x="0"
                        y="0"
                        colorInterpolationFilters="sRGB"
                        filterUnits="userSpaceOnUse"
                    >
                        <feFlood floodOpacity="0" result="BackgroundImageFix" />
                        <feColorMatrix
                            in="SourceAlpha"
                            result="hardAlpha"
                            values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0"
                        />
                        <feOffset dy="2.998" />
                        <feGaussianBlur stdDeviation="4.497" />
                        <feComposite in2="hardAlpha" operator="out" />
                        <feColorMatrix values="0 0 0 0 0.427451 0 0 0 0 0.290196 0 0 0 0 1 0 0 0 0.1 0" />
                        <feBlend in2="BackgroundImageFix" result="effect1_dropShadow_64562_26454" />
                        <feBlend in="SourceGraphic" in2="effect1_dropShadow_64562_26454" result="shape" />
                    </filter>
                </defs>
            </svg>
        </div>
    );
};

export default VoucherDisplay;
