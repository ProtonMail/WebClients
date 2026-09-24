import { useEffect, useId, useRef } from 'react';

import { useTheme } from '@proton/components';
import { MotionModeSetting } from '@proton/shared/lib/themes/constants';

const FRAME_W = 278;
const FRAME_H = 110;
const u = (px: number) => `${((px / FRAME_W) * 100).toFixed(4)}cqw`;

const ROBOTO = 'Roboto, "Helvetica Neue", Helvetica, Arial, sans-serif';

interface Palette {
    ink: string;
    link: string;
    primary: string;
    primaryRgb: string;
    onPrimary: string;
    outline: string;
    outlineRgb: string;
    cursorFill: string;
    cursorRim: string;
    cursorRimOpacity: number;
    card: string;
}

const LIGHT_PALETTE: Palette = {
    ink: '#000000',
    link: '#0C3FC5',
    primary: '#6750A4',
    primaryRgb: '103, 80, 164',
    onPrimary: '#FFFFFF',
    outline: '#49454F',
    outlineRgb: '73, 69, 79',
    cursorFill: '#363B3E',
    cursorRim: '#FFFFFF',
    cursorRimOpacity: 0.8,
    card: '#FFFFFF',
};

const DARK_PALETTE: Palette = {
    ink: '#E3E3E3',
    link: '#A8C7FA',
    primary: '#D0BCFF',
    primaryRgb: '208, 188, 255',
    onPrimary: '#381E72',
    outline: '#CAC4D0',
    outlineRgb: '202, 196, 208',
    cursorFill: '#E8EAED',
    cursorRim: '#000000',
    cursorRimOpacity: 0.6,
    card: '#1F1F1F',
};

const DURATION = 4000;
const LOOP = { duration: DURATION, iterations: Infinity } as const;

export const AuthorizationIllustration = () => {
    const { information } = useTheme();

    const areAnimationsEnabled =
        information.motionMode !== MotionModeSetting.Reduce && !information.features.animations;
    const palette = information.dark ? DARK_PALETTE : LIGHT_PALETTE;

    const uid = useId().replace(/[^a-zA-Z0-9]/g, '');
    const stateRef = useRef<HTMLDivElement>(null);
    const boxRef = useRef<HTMLDivElement>(null);
    const tickRef = useRef<HTMLDivElement>(null);
    const cursorXRef = useRef<HTMLDivElement>(null);
    const cursorYRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!areAnimationsEnabled) {
            return;
        }

        const state = stateRef.current;
        const box = boxRef.current;
        const tick = tickRef.current;
        const cx = cursorXRef.current;
        const cy = cursorYRef.current;
        if (!state || !box || !tick || !cx || !cy) {
            return;
        }

        const animations = [
            state.animate(
                [
                    { offset: 0, backgroundColor: `rgba(${palette.primaryRgb}, 0)`, easing: 'linear' },
                    { offset: 0.4821, backgroundColor: `rgba(${palette.primaryRgb}, 0)`, easing: 'linear' },
                    { offset: 0.4822, backgroundColor: `rgba(${palette.primaryRgb}, 0)`, easing: 'ease-out' },
                    { offset: 0.5579, backgroundColor: `rgba(${palette.primaryRgb}, 0.08)`, easing: 'ease-out' },
                    { offset: 0.6329, backgroundColor: `rgba(${palette.primaryRgb}, 0.1)`, easing: 'ease-out' },
                    { offset: 0.7079, backgroundColor: `rgba(${palette.primaryRgb}, 0)`, easing: 'linear' },
                    { offset: 1, backgroundColor: `rgba(${palette.primaryRgb}, 0)` },
                ],
                LOOP
            ),
            box.animate(
                [
                    {
                        offset: 0,
                        backgroundColor: 'rgba(255, 255, 255, 0)',
                        borderColor: palette.outline,
                        easing: 'linear',
                    },
                    {
                        offset: 0.5578,
                        backgroundColor: 'rgba(255, 255, 255, 0)',
                        borderColor: palette.outline,
                        easing: 'linear',
                    },
                    {
                        offset: 0.5579,
                        backgroundColor: 'rgba(255, 255, 255, 0)',
                        borderColor: palette.outline,
                        easing: 'ease-out',
                    },
                    {
                        offset: 0.5899,
                        backgroundColor: palette.primary,
                        borderColor: `rgba(${palette.outlineRgb}, 0)`,
                        easing: 'linear',
                    },
                    { offset: 1, backgroundColor: palette.primary, borderColor: `rgba(${palette.outlineRgb}, 0)` },
                ],
                LOOP
            ),
            tick.animate(
                [
                    { offset: 0, opacity: 0, easing: 'linear' },
                    { offset: 0.5579, opacity: 0, easing: 'ease-out' },
                    { offset: 0.5899, opacity: 1, easing: 'linear' },
                    { offset: 1, opacity: 1 },
                ],
                LOOP
            ),
            cx.animate(
                [
                    { offset: 0, transform: 'translateX(0%)', easing: 'linear' },
                    { offset: 0.2975, transform: 'translateX(0%)', easing: 'ease-in-out' },
                    { offset: 0.4829, transform: 'translateX(456.25%)', easing: 'linear' },
                    { offset: 0.7079, transform: 'translateX(456.25%)', easing: 'ease-out' },
                    { offset: 1, transform: 'translateX(1000%)' },
                ],
                LOOP
            ),
            cy.animate(
                [
                    { offset: 0, transform: 'translateY(0%)', easing: 'linear' },
                    { offset: 0.2975, transform: 'translateY(0%)', easing: 'ease-in-out' },
                    { offset: 0.4829, transform: 'translateY(-162.5%)', easing: 'linear' },
                    { offset: 0.5579, transform: 'translateY(-162.5%)', easing: 'ease-out' },
                    { offset: 0.5704, transform: 'translateY(-150%)', easing: 'ease-out' },
                    { offset: 0.5954, transform: 'translateY(-162.5%)', easing: 'linear' },
                    { offset: 0.7079, transform: 'translateY(-162.5%)', easing: 'ease-out' },
                    { offset: 1, transform: 'translateY(187.5%)' },
                ],
                LOOP
            ),
        ];

        return () => animations.forEach((animation) => animation.cancel());
    }, [areAnimationsEnabled, palette]);

    return (
        <div
            className="block w-full relative overflow-hidden shrink-0"
            style={{
                aspectRatio: `${FRAME_W} / ${FRAME_H}`,
                containerType: 'inline-size',
                backgroundColor: palette.card,
                borderRadius: '16px',
                isolation: 'isolate',
            }}
            aria-hidden="true"
        >
            <div
                className="absolute text-nowrap"
                style={{ left: u(17), top: u(24), font: `400 ${u(12)}/${u(16)} ${ROBOTO}`, color: palette.ink }}
            >
                Select what <span style={{ fontWeight: 600, color: palette.link }}>Proton</span> can access
            </div>

            <div className="absolute overflow-hidden" style={{ left: u(5), top: u(50), width: u(268), height: u(36) }}>
                <div className="absolute" style={{ left: u(12), top: u(3.936), width: u(12), height: u(11.128) }}>
                    <svg viewBox="0 0 42 39" fill="none" className="block w-full h-full">
                        <mask id={`gd-mask-${uid}`} maskUnits="userSpaceOnUse" x="0" y="0" width="42" height="39">
                            <path
                                fill="#FFFFFF"
                                d="M12.6763 4.80929C16.371 -1.60297 25.6083 -1.60322 29.303 4.80929L40.6788 24.5525C44.3735 30.965 39.755 38.9806 32.3654 38.9806H9.61391C2.22426 38.9806 -2.39425 30.965 1.30045 24.5525L12.6763 4.80929Z"
                            />
                        </mask>
                        <g mask={`url(#gd-mask-${uid})`}>
                            <g transform="translate(-7.0414 -9.6259)">
                                <path
                                    fill={`url(#gd-yellow-${uid})`}
                                    d="M56.0633 48.6496H32.8397L28.0339 40.3092L39.6457 20.1565L56.0633 48.6496Z"
                                />
                                <path
                                    fill={`url(#gd-blue-${uid})`}
                                    d="M2.76193e-07 48.6461L16.4176 20.153V20.1535L11.6136 28.4918H21.2226L32.8354 48.6456L0.000252875 48.6458L2.76193e-07 48.6461Z"
                                />
                                <path
                                    fill={`url(#gd-green-${uid})`}
                                    d="M28.0352 8.72478e-07L39.6477 20.1545L34.8429 28.4933H11.6176L28.0352 8.72478e-07Z"
                                />
                            </g>
                        </g>
                        <defs>
                            <linearGradient
                                id={`gd-yellow-${uid}`}
                                x1="52.7006"
                                y1="47.0238"
                                x2="29.801"
                                y2="33.2903"
                                gradientUnits="userSpaceOnUse"
                            >
                                <stop offset="0.09" stopColor="#FFE921" />
                                <stop offset="1" stopColor="#FEC700" />
                            </linearGradient>
                            <linearGradient
                                id={`gd-blue-${uid}`}
                                x1="32.6838"
                                y1="51.0782"
                                x2="7.6688"
                                y2="35.9761"
                                gradientUnits="userSpaceOnUse"
                            >
                                <stop offset="0.15" stopColor="#A9A8FF" />
                                <stop offset="0.33" stopColor="#6D97FF" />
                                <stop offset="0.48" stopColor="#3186FF" />
                            </linearGradient>
                            <linearGradient
                                id={`gd-green-${uid}`}
                                x1="36.3434"
                                y1="14.6793"
                                x2="11.006"
                                y2="26.4821"
                                gradientUnits="userSpaceOnUse"
                            >
                                <stop offset="0.55" stopColor="#0EBC5F" />
                                <stop offset="0.85" stopColor="#78C9FF" />
                            </linearGradient>
                        </defs>
                    </svg>
                </div>

                <div
                    className="absolute"
                    style={{
                        left: u(34),
                        top: u(4),
                        width: u(206),
                        font: `400 ${u(9)}/${u(16)} ${ROBOTO}`,
                        color: palette.ink,
                    }}
                >
                    See and download all your Google Drive files.
                </div>
                <div
                    className="absolute text-nowrap"
                    style={{ left: u(34), top: u(20), font: `600 ${u(9)}/${u(16)} ${ROBOTO}`, color: palette.link }}
                >
                    See access details
                </div>

                <div
                    ref={stateRef}
                    className="absolute rounded-50"
                    style={{
                        left: u(237.187),
                        top: u(-0.188),
                        width: u(24.375),
                        height: u(24.375),
                        backgroundColor: `rgba(${palette.primaryRgb}, 0.1)`,
                    }}
                >
                    <div
                        ref={boxRef}
                        className="absolute"
                        style={{
                            left: u(6.703),
                            top: u(6.703),
                            width: u(10.969),
                            height: u(10.969),
                            boxSizing: 'border-box',
                            borderRadius: u(1.219),
                            borderWidth: u(1.219),
                            borderStyle: 'solid',
                            backgroundColor: palette.primary,
                            borderColor: `rgba(${palette.outlineRgb}, 0)`,
                        }}
                    />

                    <div
                        ref={tickRef}
                        className="absolute"
                        style={{ left: u(4.875), top: u(4.875), width: u(14.625), height: u(14.625) }}
                    >
                        <svg viewBox="0 0 14.625 14.625" fill="none" className="block w-full h-full">
                            <path
                                d="M6.09375 9.99375L3.65625 7.55625L4.50937 6.70313L6.09375 8.2875L10.1156 4.26562L10.9688 5.11875L6.09375 9.99375Z"
                                fill={palette.onPrimary}
                            />
                        </svg>
                    </div>
                </div>
            </div>

            <div
                ref={cursorXRef}
                className="absolute"
                style={{ left: u(181), top: u(88), width: u(16), height: u(16), transform: 'translateX(456.25%)' }}
            >
                <div ref={cursorYRef} className="w-full h-full" style={{ transform: 'translateY(-162.5%)' }}>
                    <div
                        className="absolute"
                        style={{ left: u(-4.5634), top: u(-4), width: u(22.4826), height: u(24.1853) }}
                    >
                        <svg
                            viewBox="0 0 22.4826 24.1853"
                            fill="none"
                            className="block w-full h-full"
                            style={{ overflow: 'visible' }}
                        >
                            <g filter={`url(#cursor-shadow-${uid})`}>
                                <path
                                    fillRule="evenodd"
                                    clipRule="evenodd"
                                    d="M12.4036 12.5165L17.0495 10.8654L4.56291 4.00044L8.20316 17.7769L10.9292 13.6684L14.1929 17.8458L15.6673 16.6939L12.4036 12.5165V12.5165Z"
                                    fill={palette.cursorFill}
                                />
                                <path
                                    d="M4.80412 3.56196L17.2905 10.4272L18.266 10.9633L17.2172 11.3364L13.224 12.7553L16.061 16.3862L16.3696 16.7797L15.975 17.0883L14.5004 18.2397L14.1069 18.5473L13.7992 18.1538L10.9623 14.5219L8.61955 18.0532L8.00432 18.9809L7.72014 17.9047L4.07951 4.12837L3.78166 3.00044L4.80412 3.56196Z"
                                    stroke={palette.cursorRim}
                                    strokeOpacity={palette.cursorRimOpacity}
                                />
                            </g>
                            <defs>
                                <filter
                                    id={`cursor-shadow-${uid}`}
                                    x="0"
                                    y="0"
                                    width="22.4826"
                                    height="24.1853"
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
                                    <feGaussianBlur stdDeviation="1.5" />
                                    <feColorMatrix type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.25 0" />
                                    <feBlend mode="normal" in2="BackgroundImageFix" result="effect1_dropShadow" />
                                    <feBlend mode="normal" in="SourceGraphic" in2="effect1_dropShadow" result="shape" />
                                </filter>
                            </defs>
                        </svg>
                    </div>
                </div>
            </div>
        </div>
    );
};
