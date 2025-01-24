import { useState } from 'react';

import { c } from 'ttag';

import { featureTourActions } from '@proton/account/featuresTour';
import { DrawerAppButton, FEATURE_TOUR_STEPS, FeatureTourDrawerSpotlight } from '@proton/components';
import type { Props } from '@proton/components/components/drawer/drawerAppButtons/DrawerAppButton';
import LogoBase from '@proton/components/components/logo/LogoBase';
import type { Optional } from '@proton/shared/lib/interfaces';
import generateUID from '@proton/utils/generateUID';

import { useMailDispatch } from 'proton-mail/store/hooks';

const FeatureTourDrawerButton = ({ ...rest }: Optional<Omit<Props, 'tooltipText' | 'buttonContent'>, 'onClick'>) => {
    const dispatch = useMailDispatch();

    const handleClick = () => {
        dispatch(featureTourActions.display({ steps: FEATURE_TOUR_STEPS, origin: 'drawer' }));
    };

    const tooltipText = c('Title').t`Discover your subscription benefits`;

    const [uid] = useState(generateUID('feature-tour-logo'));

    return (
        <FeatureTourDrawerSpotlight>
            <DrawerAppButton
                alt={tooltipText}
                tooltipText={tooltipText}
                aria-controls="drawer-features-tour-button"
                data-testid="drawer-features-tour-button"
                buttonContent={
                    <LogoBase
                        logoWidth={28}
                        logoHeight={28}
                        variant="with-wordmark"
                        focusable="false"
                        aria-hidden="true"
                        uid={uid}
                    >
                        <g clipPath="url(#clip0_44822_36749)">
                            <path
                                d="M11 20H17V21.3455C17 21.4402 16.9465 21.5268 16.8618 21.5691L16.4472 21.7764C16.263 21.8685 16.263 22.1315 16.4472 22.2236L16.5528 22.2764C16.737 22.3685 16.737 22.6315 16.5528 22.7236L16.4472 22.7764C16.263 22.8685 16.263 23.1315 16.4472 23.2236L16.5528 23.2764C16.737 23.3685 16.737 23.6315 16.5528 23.7236L16.1382 23.9309C16.0535 23.9732 16 24.0598 16 24.1545V24.75C16 24.8881 15.8881 25 15.75 25H14H12.25C12.1119 25 12 24.8881 12 24.75V24.1545C12 24.0598 11.9465 23.9732 11.8618 23.9309L11.4472 23.7236C11.263 23.6315 11.263 23.3685 11.4472 23.2764L11.5528 23.2236C11.737 23.1315 11.737 22.8685 11.5528 22.7764L11.4472 22.7236C11.263 22.6315 11.263 22.3685 11.4472 22.2764L11.5528 22.2236C11.737 22.1315 11.737 21.8685 11.5528 21.7764L11.1382 21.5691C11.0535 21.5268 11 21.4402 11 21.3455V20Z"
                                fill="#2EB8B8"
                            />
                            <path
                                d="M17 20C17 18.4397 18.0104 17.0969 19.1963 16.0829C20.9123 14.6156 22 12.4348 22 10C22 5.58179 18.4183 2 14 2C9.58167 2 6 5.58179 6 10C6 12.4348 7.08769 14.6156 8.80371 16.0829C9.98965 17.0969 11 18.4397 11 20H17Z"
                                fill="url(#paint0_linear_44822_36749)"
                            />
                            <path
                                d="M12.5 12V11M12.5 12V13M12.5 12H14M15.5 12V13M15.5 12V11M15.5 12H14M14 12V20"
                                stroke="#1E8183"
                                strokeWidth="0.5"
                            />
                        </g>
                        <defs>
                            <filter
                                id="filter0_d_44822_36749"
                                x="15.5"
                                y="-1"
                                width="16"
                                height="16"
                                filterUnits="userSpaceOnUse"
                                colorInterpolationFilters="sRGB"
                            >
                                <feFlood floodOpacity="0" result="BackgroundImageFix" />
                                <feColorMatrix
                                    in="SourceAlpha"
                                    type="matrix"
                                    values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0"
                                    result="hardAlpha"
                                />
                                <feOffset dy="1" />
                                <feGaussianBlur stdDeviation="2" />
                                <feColorMatrix type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.1 0" />
                                <feBlend
                                    mode="normal"
                                    in2="BackgroundImageFix"
                                    result="effect1_dropShadow_44822_36749"
                                />
                                <feBlend
                                    mode="normal"
                                    in="SourceGraphic"
                                    in2="effect1_dropShadow_44822_36749"
                                    result="shape"
                                />
                            </filter>
                            <linearGradient
                                id="paint0_linear_44822_36749"
                                x1="14"
                                y1="2"
                                x2="14"
                                y2="28.25"
                                gradientUnits="userSpaceOnUse"
                            >
                                <stop stopColor="#D2F5F2" />
                                <stop offset="1" stopColor="#42BFBD" />
                            </linearGradient>
                            <clipPath id="clip0_44822_36749">
                                <rect width="28" height="28" fill="white" />
                            </clipPath>
                        </defs>
                    </LogoBase>
                }
                onClick={handleClick}
                {...rest}
            />
        </FeatureTourDrawerSpotlight>
    );
};

export default FeatureTourDrawerButton;
