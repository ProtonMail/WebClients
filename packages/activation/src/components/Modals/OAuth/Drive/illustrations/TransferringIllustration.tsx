import { useEffect, useId, useRef } from 'react';

import { useTheme } from '@proton/components';
import { MotionModeSetting } from '@proton/shared/lib/themes/constants';

const FRAME_W = 360;
const FRAME_H = 188;
const STAGE_W = 360;
const STAGE_H = 189;
const pctX = (px: number) => `${(px / STAGE_W) * 100}%`;
const pctY = (px: number) => `${(px / STAGE_H) * 100}%`;

interface Palette {
    googleTile: string;
    protonTile: string;
    tileShadow: string;
    arrow: string;
    arrowOpacity: number;
    badge: string;
    badgeGlyph: string;
    badgeArrow: string;
    dots: string;
}

const LIGHT_PALETTE: Palette = {
    googleTile: 'linear-gradient(to bottom, #FFFFFF, #F5F5F5)',
    protonTile: '#F7F7F7',
    tileShadow: '0px 1px 2px rgba(0,0,0,0.05), inset 0px 0px 1.5px rgba(195,195,195,0.4), inset 0px 18px 22px #FFFFFF',
    arrow: '#6D4AFF',
    arrowOpacity: 0.5,
    badge: '#FBF0DD',
    badgeGlyph: '#E7940B',
    badgeArrow: '#FFFFFF',
    dots: '#EBEBFA',
};

const DARK_PALETTE: Palette = {
    googleTile: '#0B0B0C',
    protonTile: '#0B0B0C',
    tileShadow: '0px 1px 2px rgba(0,0,0,0.6), inset 0px 0px 1.5px rgba(255,255,255,0.4), inset 0px 18px 22px #2C2C2C',
    arrow: '#8A6EFF',
    arrowOpacity: 1,
    badge: '#3B2C0F',
    badgeGlyph: '#E7940B',
    badgeArrow: '#FFFFFF',
    dots: 'rgba(255,255,255,0.107)',
};

const DOT_PITCH = 17;
const DOT_RADIUS = 1.5;
const DOTS_W = 421;
const DOTS_H = 192;
const DOT_ALPHA = [
    [
        0.72, 0.7, 1, 0.58, 0.95, 0.9, 0.48, 0.22, 0.67, 0.84, 0.22, 0.5, 0.57, 0.37, 0.83, 0.27, 0.96, 0.63, 0.73,
        0.27, 0.98, 0.58, 0.97, 0.83, 0.53,
    ],
    [
        0.99, 0.44, 0.66, 0.23, 0.98, 0.53, 0.79, 0.95, 0.75, 0.86, 0.23, 0.59, 0.7, 0.86, 0.79, 0.7, 0.85, 0.74, 0.25,
        0.54, 0.84, 0.27, 0.39, 0.54, 0.52,
    ],
    [
        0.75, 0.72, 0.64, 0.55, 0.69, 0.57, 0.35, 0.46, 0.81, 0.57, 0.45, 0.65, 0.55, 0.68, 0.96, 0.36, 0.82, 0.47,
        0.77, 0.82, 0.58, 0.49, 0.28, 0.9, 0.34,
    ],
    [
        0.44, 0.24, 0.48, 0.66, 0.38, 0.56, 0.91, 0.48, 0.55, 0.4, 0.21, 0.78, 0.41, 0.52, 0.92, 0.26, 0.31, 0.63, 0.43,
        0.62, 0.39, 0.84, 0.2, 0.29, 0.28,
    ],
    [
        0.85, 0.37, 0.5, 0.87, 0.82, 0.49, 0.77, 0.81, 0.47, 0.57, 0.96, 0.86, 0.57, 0.4, 0.67, 0.48, 0.66, 0.84, 0.62,
        0.41, 0.57, 0.69, 0.86, 0.88, 0.38,
    ],
    [
        0.55, 0.39, 0.32, 0.4, 0.75, 0.82, 0.24, 0.67, 0.38, 0.65, 0.51, 0.65, 0.2, 0.73, 0.54, 0.22, 0.36, 0.84, 0.93,
        0.47, 0.79, 0.86, 0.91, 0.49, 0.88,
    ],
    [
        0.41, 0.31, 0.99, 0.43, 0.83, 0.4, 0.5, 0.95, 0.22, 0.58, 0.42, 0.29, 0.3, 0.2, 0.23, 0.87, 0.36, 0.94, 0.67,
        0.63, 0.2, 0.47, 0.27, 0.41, 0.9,
    ],
    [
        0.97, 0.92, 1, 0.46, 0.38, 0.21, 0.31, 0.86, 0.4, 0.35, 0.82, 0.91, 0.84, 0.42, 0.71, 0.81, 0.98, 0.97, 0.22,
        0.95, 0.44, 0.25, 0.51, 0.78, 0.51,
    ],
    [
        0.95, 0.34, 0.37, 0.69, 0.89, 0.98, 0.26, 0.54, 0.84, 0.61, 1, 0.45, 0.66, 0.96, 0.3, 0.33, 0.23, 0.67, 0.85,
        0.98, 0.33, 0.28, 0.35, 0.54, 0.58,
    ],
    [
        0.27, 0.77, 0.66, 0.54, 0.36, 0.4, 0.97, 0.68, 0.43, 0.77, 0.52, 0.43, 0.71, 0.79, 0.47, 0.47, 0.96, 0.87, 0.44,
        0.6, 0.94, 0.4, 1, 0.27, 0.52,
    ],
    [
        0.6, 0.85, 0.72, 0.29, 0.66, 0.84, 0.29, 0.34, 0.85, 0.58, 0.3, 0.26, 0.28, 0.81, 0.76, 0.77, 0.37, 0.7, 0.32,
        0.53, 0.25, 0.88, 0.85, 0.89, 0.28,
    ],
    [
        0.26, 0.71, 0.61, 0.46, 0.48, 0.78, 0.65, 0.82, 0.22, 0.71, 0.26, 0.99, 0.5, 0.99, 0.29, 0.21, 0.54, 0.57, 0.6,
        0.31, 0.22, 0.95, 0.36, 0.85, 0.25,
    ],
];

const BAND_W = 176;
const BAND_Y = 56;
const BAND_H = 78;

const GAP_IN = 32;
const GAP_OUT = 144;
const FEATHER = 16;
const maskStop = (px: number) => `${((px / BAND_W) * 100).toFixed(3)}%`;
const BAND_MASK =
    `linear-gradient(to right, transparent ${maskStop(GAP_IN)}, #000 ${maskStop(GAP_IN + FEATHER)}, ` +
    `#000 ${maskStop(GAP_OUT - FEATHER)}, transparent ${maskStop(GAP_OUT)})`;

const TILE_MASK =
    "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 108 109'%3E%3Cpath d='M108 79.7148L97.1426 68.8574C89.3321 61.0469 76.6679 61.0469 68.8574 68.8574C61.0469 76.6679 61.0469 89.3321 68.8574 97.1426L80.7148 109H0V0H108V79.7148Z' fill='%23000'/%3E%3C/svg%3E\")";

const ARROW_BOX = 24;

const ICON_SCALE = 0.78;
const bandX = (px: number) => `${(px / BAND_W) * 100}%`;
const bandY = (px: number) => `${(px / BAND_H) * 100}%`;

const LANES = [
    { y: 95, scale: 1, opacity: 1, dur: 420 },
    { y: 87, scale: 0.9, opacity: 0.82, dur: 460 },
    { y: 103, scale: 0.9, opacity: 0.82, dur: 470 },
    { y: 79, scale: 0.8, opacity: 0.68, dur: 505 },
    { y: 111, scale: 0.8, opacity: 0.68, dur: 510 },
    { y: 71, scale: 0.68, opacity: 0.52, dur: 560 },
    { y: 119, scale: 0.68, opacity: 0.52, dur: 565 },
] as const;

const WAVES = [
    [
        [5, 480, 'docs', 1.06],
        [3, 518, 'folder', 0.9],
        [6, 556, 'pdf', 1.12],
        [1, 594, 'sheets', 0.94],
        [4, 632, 'zip', 1.0],
        [2, 670, 'docs', 0.88],
        [0, 708, 'folder', 1.08],
    ],
    [
        [6, 1000, 'sheets', 0.92],
        [4, 1038, 'pdf', 1.04],
        [2, 1076, 'folder', 1.14],
        [5, 1114, 'docs', 0.9],
        [1, 1152, 'zip', 1.02],
        [3, 1190, 'sheets', 1.1],
        [0, 1228, 'pdf', 0.96],
    ],
    [
        [6, 1520, 'folder', 1.08],
        [3, 1558, 'docs', 0.92],
        [1, 1596, 'zip', 1.06],
        [5, 1634, 'sheets', 0.98],
        [2, 1672, 'pdf', 1.12],
        [4, 1710, 'docs', 0.9],
        [0, 1748, 'sheets', 1.0],
    ],
] as const;

const STILL_AT = 970;

const ARROWS = WAVES.flatMap((wave) =>
    wave.map(([laneIndex, arrive, icon, size]) => {
        const lane = LANES[laneIndex];
        const box = ARROW_BOX * lane.scale * ICON_SCALE * size;
        const travel = BAND_W + box;
        const delay = arrive - (GAP_OUT / travel) * lane.dur;
        const progress = (STILL_AT - delay) / lane.dur;

        return {
            ...lane,
            icon,
            arrive,
            box,
            travel,
            delay,
            rest: Math.min(Math.max(-box + progress * travel, -box), BAND_W),
        };
    })
);

const DROP_WAIT = 300;
const DROP_IN = 620;
const DROP_DRIFT = 1580;
const DROP_OUT = 1740;

const SOFT = 'cubic-bezier(0.5,0,0.5,1)';

const SUBJECT_SCALE = 0.8;

const DURATION = 1820;
const LOOP = { duration: DURATION, iterations: Infinity } as const;
const at = (ms: number) => ms / DURATION;

export const TransferringIllustration = () => {
    const { information } = useTheme();

    const areAnimationsEnabled =
        information.motionMode !== MotionModeSetting.Reduce && !information.features.animations;
    const palette = information.dark ? DARK_PALETTE : LIGHT_PALETTE;

    const uid = useId().replace(/[^a-zA-Z0-9]/g, '');
    const fileRefs = useRef<(HTMLDivElement | null)[]>([]);
    const downloadRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!areAnimationsEnabled) {
            return;
        }

        const download = downloadRef.current;
        if (!download) {
            return;
        }

        const animations: Animation[] = [];

        ARROWS.forEach((file, index) => {
            const node = fileRefs.current[index];
            if (!node) {
                return;
            }

            const { box, travel, delay } = file;

            const from = `translateX(${(((-box - file.rest) / box) * 100).toFixed(3)}%)`;
            const to = `translateX(${(((BAND_W - file.rest) / box) * 100).toFixed(3)}%)`;

            const frames: Keyframe[] = [{ offset: 0, transform: from, easing: 'linear' }];
            if (delay > 0) {
                frames.push({ offset: at(delay), transform: from, easing: 'linear' });
            }

            const land = delay + file.dur;
            if (land <= DURATION) {
                frames.push({ offset: at(land), transform: to, easing: 'linear' }, { offset: 1, transform: to });
            } else {
                const cut = -box + ((DURATION - delay) / file.dur) * travel;
                frames.push({
                    offset: 1,
                    transform: `translateX(${(((cut - file.rest) / box) * 100).toFixed(3)}%)`,
                });
            }

            animations.push(node.animate(frames, LOOP));
        });

        animations.push(
            download.animate(
                [
                    { offset: 0, opacity: 0, easing: 'linear' },
                    { offset: at(DROP_WAIT), opacity: 0, easing: SOFT },
                    { offset: at(DROP_IN), opacity: 1, easing: 'linear' },
                    { offset: at(DROP_OUT), opacity: 1, easing: 'linear' },
                    { offset: 1, opacity: 0 },
                ],
                LOOP
            )
        );

        animations.push(
            download.animate(
                [
                    { offset: 0, transform: 'translate(-50%, -50%) translateX(-157.27%)', easing: 'linear' },
                    {
                        offset: at(DROP_WAIT),
                        transform: 'translate(-50%, -50%) translateX(-157.27%)',
                        easing: 'ease-in',
                    },
                    { offset: at(DROP_IN), transform: 'translate(-50%, -50%) translateX(-6.17%)', easing: 'linear' },
                    {
                        offset: at(DROP_DRIFT),
                        transform: 'translate(-50%, -50%) translateX(5.89%)',
                        easing: 'ease-in',
                    },
                    {
                        offset: at(DROP_OUT),
                        transform: 'translate(-50%, -50%) translateX(169.61%)',
                        easing: 'linear',
                    },
                    { offset: 1, transform: 'translate(-50%, -50%) translateX(169.61%)' },
                ],
                LOOP
            )
        );

        return () => animations.forEach((animation) => animation.cancel());
    }, [areAnimationsEnabled]);

    return (
        <div
            className="block w-full relative overflow-hidden shrink-0"
            style={{ aspectRatio: `${FRAME_W} / ${FRAME_H}`, isolation: 'isolate' }}
            aria-hidden="true"
        >
            <div
                className="absolute inset-0"
                style={{
                    maskImage: 'radial-gradient(ellipse at center, #000 65.57%, transparent 100%)',
                    WebkitMaskImage: 'radial-gradient(ellipse at center, #000 65.57%, transparent 100%)',
                }}
            >
                <svg
                    viewBox={`0 0 ${DOTS_W} ${DOTS_H}`}
                    preserveAspectRatio="none"
                    fill="none"
                    className="absolute inset-0 w-full h-full block"
                >
                    {DOT_ALPHA.map((row, rowIndex) =>
                        row.map((dotOpacity, columnIndex) => (
                            <circle
                                key={`${rowIndex}-${columnIndex}`}
                                cx={columnIndex * DOT_PITCH}
                                cy={rowIndex * DOT_PITCH + DOT_RADIUS}
                                r={DOT_RADIUS}
                                fill={palette.dots}
                                opacity={dotOpacity}
                            />
                        ))
                    )}
                </svg>
            </div>
            <div
                className="absolute overflow-hidden"
                style={{
                    left: '50%',
                    top: `${((FRAME_H / 2 - 0.5) / FRAME_H) * 100}%`,
                    width: `${(STAGE_W / FRAME_W) * 100}%`,
                    height: `${(STAGE_H / FRAME_H) * 100}%`,
                    transform: 'translate(-50%, -50%)',
                }}
            >
                <svg width="0" height="0" className="absolute" aria-hidden="true">
                    <defs>
                        <symbol id={`fi-docs-${uid}`} viewBox="0 0 24 24">
                            <path
                                d="M4 3.5C4 2.11929 5.11929 1 6.5 1H12.5L19.7071 8.20711C19.8946 8.39464 20 8.649 20 8.91421V20.5C20 21.8807 18.8807 23 17.5 23H6.5C5.11929 23 4 21.8807 4 20.5V3.5Z"
                                fill="#3186FF"
                            />
                            <path
                                d="M4 3.5C4 2.11929 5.11929 1 6.5 1H12.5L19.7071 8.20711C19.8946 8.39464 20 8.649 20 8.91421V20.5C20 21.8807 18.8807 23 17.5 23H6.5C5.11929 23 4 21.8807 4 20.5V3.5Z"
                                fill={`url(#paint0_linear_4122_1617-${uid})`}
                            />
                            <path
                                d="M4 3.5C4 2.11929 5.11929 1 6.5 1H12.5L19.7071 8.20711C19.8946 8.39464 20 8.649 20 8.91421V20.5C20 21.8807 18.8807 23 17.5 23H6.5C5.11929 23 4 21.8807 4 20.5V3.5Z"
                                fill={`url(#paint1_linear_4122_1617-${uid})`}
                            />

                            <path d="M12.5 6V1L19 7.5H14C13.1716 7.5 12.5 6.82843 12.5 6Z" fill="#77BBFF" />
                            <path d="M8.875 15H15.5" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
                            <path d="M8.875 18.625H13.375" stroke="white" strokeWidth="1.5" strokeLinecap="round" />

                            <defs>
                                <linearGradient
                                    id={`paint0_linear_4122_1617-${uid}`}
                                    x1="14"
                                    y1="12.5"
                                    x2="9.5"
                                    y2="22"
                                    gradientUnits="userSpaceOnUse"
                                >
                                    <stop stopColor="#ACAAFF" stopOpacity="0" />
                                    <stop offset="1" stopColor="#ACAAFF" stopOpacity="0.9" />
                                </linearGradient>
                                <linearGradient
                                    id={`paint1_linear_4122_1617-${uid}`}
                                    x1="20"
                                    y1="12"
                                    x2="4"
                                    y2="12"
                                    gradientUnits="userSpaceOnUse"
                                >
                                    <stop stopColor="#3186FF" />
                                    <stop offset="0.2" stopColor="#3186FF" stopOpacity="0" />
                                    <stop offset="0.8" stopColor="#3186FF" stopOpacity="0" />
                                    <stop offset="1" stopColor="#3186FF" />
                                </linearGradient>
                            </defs>
                        </symbol>

                        <symbol id={`fi-sheets-${uid}`} viewBox="0 0 24 24">
                            <rect x="1" y="5.5" width="13" height="13" rx="2.5" fill="#029853" />

                            <path
                                d="M3 6.5C3 5.11929 4.11929 4 5.5 4H20.75C22.1307 4 23.25 5.11929 23.25 6.5V17.5C23.25 18.8807 22.1307 20 20.75 20H5.5C4.11929 20 3 18.8807 3 17.5V6.5Z"
                                fill={`url(#paint0_linear_4122_1597-${uid})`}
                            />
                            <path
                                d="M3 6.5C3 5.11929 4.11929 4 5.5 4H20.75C22.1307 4 23.25 5.11929 23.25 6.5V17.5C23.25 18.8807 22.1307 20 20.75 20H5.5C4.11929 20 3 18.8807 3 17.5V6.5Z"
                                fill={`url(#paint1_linear_4122_1597-${uid})`}
                            />

                            <path
                                d="M18.125 9.5V17.5M20.75 15.125H10"
                                stroke="white"
                                strokeWidth="1.5"
                                strokeLinecap="round"
                            />

                            <defs>
                                <linearGradient
                                    id={`paint0_linear_4122_1597-${uid}`}
                                    x1="3"
                                    y1="12"
                                    x2="23.25"
                                    y2="12"
                                    gradientUnits="userSpaceOnUse"
                                >
                                    <stop stopColor="#7BC8FE" />
                                    <stop offset="0.676754" stopColor="#11BC5C" />
                                </linearGradient>
                                <linearGradient
                                    id={`paint1_linear_4122_1597-${uid}`}
                                    x1="13.1968"
                                    y1="20"
                                    x2="13.1968"
                                    y2="4"
                                    gradientUnits="userSpaceOnUse"
                                >
                                    <stop stopColor="#14BA61" />
                                    <stop offset="0.19" stopColor="#14BA61" stopOpacity="0" />
                                    <stop offset="0.81" stopColor="#14BA61" stopOpacity="0" />
                                    <stop offset="1" stopColor="#14BA61" />
                                </linearGradient>
                            </defs>
                        </symbol>

                        <symbol id={`fi-pdf-${uid}`} viewBox="0 0 24 24">
                            <path
                                d="M2.4 3C2.4 1.34315 3.74314 0 5.4 0H14.1065C14.9488 0 15.7523 0.354071 16.3206 0.975692L20.8141 5.89041C21.3196 6.44336 21.6 7.16548 21.6 7.91471V21C21.6 22.6569 20.2569 24 18.6 24H5.4C3.74314 24 2.4 22.6569 2.4 21V3Z"
                                fill="#EC3213"
                            />

                            <path
                                d="M21.5136 7.20003H16.2C15.2059 7.20003 14.4 6.39414 14.4 5.40003V0.0144043C15.1334 0.0864589 15.8187 0.426762 16.3206 0.975722L20.8141 5.89044C21.1559 6.26428 21.3947 6.71544 21.5136 7.20003Z"
                                fill="#FF7733"
                            />
                            <path
                                d="M21.6 8.4H16.2C14.5431 8.4 13.2 7.05685 13.2 5.4V0H14.1065C14.205 0 14.3029 0.00483767 14.4 0.0143748V5.4C14.4 6.39411 15.2059 7.2 16.2 7.2H21.5136C21.5706 7.43217 21.6 7.67202 21.6 7.91471V8.4Z"
                                fill="#C21000"
                            />

                            <path
                                d="M11.9176 12.5056L12.6407 11.2528C12.7139 11.1258 12.7525 10.9818 12.7525 10.8353C12.7525 10.6887 12.7139 10.5447 12.6406 10.4178C12.5674 10.2908 12.462 10.1854 12.3351 10.112C12.2081 10.0387 12.0642 10.0001 11.9176 10C11.771 10 11.627 10.0386 11.5 10.1119C11.373 10.1852 11.2676 10.2906 11.1943 10.4176C11.1209 10.5445 11.0823 10.6886 11.0823 10.8352C11.0823 10.9818 11.1208 11.1258 11.1941 11.2528L11.9176 12.5056ZM11.9176 12.5056L13.5404 15.6538M11.9176 12.5056L10.309 15.6538M10.309 15.6538H8.69887C8.58131 15.6538 8.46492 15.677 8.35631 15.722C8.24771 15.767 8.14903 15.8329 8.0659 15.916C7.98278 15.9991 7.91685 16.0978 7.87186 16.2064C7.82688 16.315 7.80372 16.4314 7.80372 16.549C7.80372 17.4492 8.98353 17.7859 9.45886 17.0216L10.309 15.6538ZM10.309 15.6538H13.5404M13.5404 15.6538H15.1509C15.2683 15.6538 15.3846 15.677 15.4931 15.722C15.6016 15.767 15.7002 15.833 15.7831 15.9161C15.8661 15.9993 15.9319 16.098 15.9766 16.2066C16.0214 16.3152 16.0443 16.4315 16.0441 16.549C16.0441 17.4492 14.8647 17.7859 14.3893 17.0216L13.5404 15.6538Z"
                                stroke="white"
                                strokeWidth="0.937012"
                                strokeMiterlimit="10"
                            />
                        </symbol>

                        <symbol id={`fi-folder-${uid}`} viewBox="0 0 24 24">
                            <path
                                fillRule="evenodd"
                                clipRule="evenodd"
                                d="M24 20.0808V6.94949C24 5.88956 23.1422 5.0303 22.084 5.0303H13.1429C12.5974 5.0303 12.0666 4.85309 11.6303 4.52525L8.77983 2.38384C8.44818 2.13468 8.04481 2 7.63025 2H1.91597C0.857808 2 0 2.85925 0 3.91919V20.0808C0 21.1407 0.857807 22 1.91597 22H22.084C23.1422 22 24 21.1407 24 20.0808Z"
                                fill="#F5A623"
                            />
                        </symbol>

                        <symbol id={`fi-zip-${uid}`} viewBox="0 0 24 24">
                            <path
                                d="M2.4 3C2.4 1.34315 3.74314 0 5.4 0H14.1065C14.9488 0 15.7523 0.354071 16.3206 0.975692L20.8141 5.89041C21.3196 6.44336 21.6 7.16548 21.6 7.91471V21C21.6 22.6569 20.2569 24 18.6 24H5.4C3.74314 24 2.4 22.6569 2.4 21V3Z"
                                fill="#DADBE0"
                            />

                            <path
                                d="M21.5136 7.20003H16.2C15.2059 7.20003 14.4 6.39414 14.4 5.40003V0.0144043C15.1334 0.0864589 15.8187 0.426762 16.3206 0.975722L20.8141 5.89044C21.1559 6.26428 21.3947 6.71544 21.5136 7.20003Z"
                                fill="#EBECF0"
                            />
                            <path
                                d="M21.6 8.4H16.2C14.5431 8.4 13.2 7.05685 13.2 5.4V0H14.1065C14.205 0 14.3029 0.00483767 14.4 0.0143748V5.4C14.4 6.39411 15.2059 7.2 16.2 7.2H21.5136C21.5706 7.43217 21.6 7.67202 21.6 7.91471V8.4Z"
                                fill="#BABBC5"
                            />

                            <path
                                d="M12.8161 11C12.8161 11.6712 13.4164 13.4053 14.0202 14.9795C14.5725 16.4194 13.5272 17.9999 11.9851 18C10.4359 17.9997 9.39099 16.4055 9.95578 14.9629C10.5703 13.3931 11.1794 11.6688 11.1794 11H12.8161ZM11.7497 15C11.3356 15.0001 10.9997 15.3359 10.9997 15.75C10.9997 16.1641 11.3356 16.4999 11.7497 16.5H12.2497C12.6639 16.4999 12.9997 16.1642 12.9997 15.75C12.9997 15.3358 12.6639 15.0001 12.2497 15H11.7497ZM12.2712 9C12.6853 9.00015 13.0212 9.33588 13.0212 9.75C13.0212 10.1641 12.6853 10.4998 12.2712 10.5H11.7253C11.3111 10.5 10.9753 10.1642 10.9753 9.75C10.9753 9.33579 11.3111 9 11.7253 9H12.2712ZM12.2712 7C12.6853 7.00015 13.0212 7.33588 13.0212 7.75C13.0212 8.16412 12.6853 8.49985 12.2712 8.5H11.7253C11.3111 8.5 10.9753 8.16421 10.9753 7.75C10.9753 7.33579 11.3111 7 11.7253 7H12.2712ZM12.2712 5C12.6853 5.00015 13.0212 5.33588 13.0212 5.75C13.0212 6.16412 12.6853 6.49985 12.2712 6.5H11.7253C11.3111 6.5 10.9753 6.16421 10.9753 5.75C10.9753 5.33579 11.3111 5 11.7253 5H12.2712ZM12.2712 3C12.6853 3.00015 13.0212 3.33588 13.0212 3.75C13.0212 4.16412 12.6853 4.49985 12.2712 4.5H11.7253C11.3111 4.5 10.9753 4.16421 10.9753 3.75C10.9753 3.33579 11.3111 3 11.7253 3H12.2712Z"
                                fill="#3A3F4A"
                            />
                        </symbol>
                    </defs>
                </svg>

                <div className="absolute inset-0" style={{ transform: `scale(${SUBJECT_SCALE})` }}>
                    <div
                        className="absolute overflow-hidden"
                        style={{
                            left: '50%',
                            transform: 'translateX(-50%)',
                            top: pctY(BAND_Y),
                            width: pctX(BAND_W),
                            height: pctY(BAND_H),
                            opacity: palette.arrowOpacity,
                            maskImage: BAND_MASK,
                            WebkitMaskImage: BAND_MASK,
                        }}
                    >
                        {ARROWS.map((file, index) => (
                            <div
                                key={`${file.y}-${file.arrive}`}
                                ref={(node) => {
                                    fileRefs.current[index] = node;
                                }}
                                className="absolute"
                                style={{
                                    left: bandX(file.rest),
                                    top: bandY(file.y - BAND_Y - file.box / 2),
                                    width: bandX(file.box),
                                    height: bandY(file.box),
                                    opacity: file.opacity,
                                }}
                            >
                                <svg viewBox="0 0 24 24" fill="none" className="absolute inset-0 w-full h-full block">
                                    <use href={`#fi-${file.icon}-${uid}`} />
                                </svg>
                            </div>
                        ))}
                    </div>

                    <div
                        className="absolute overflow-hidden"
                        style={{
                            left: pctX(44),
                            top: pctY(55),
                            width: pctX(80),
                            height: pctY(80),
                            borderRadius: '30%',
                            background: palette.googleTile,
                            boxShadow: palette.tileShadow,
                        }}
                    >
                        <svg
                            viewBox="0 0 42 39"
                            fill="none"
                            className="absolute block"
                            style={{
                                left: '50%',
                                top: '50.625%',
                                transform: 'translate(-50%, -50%)',
                                width: '52.5%',
                                height: '48.75%',
                            }}
                        >
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
                            left: pctX(223),
                            top: pctY(43),
                            width: pctX(108),
                            height: pctY(109),
                            maskImage: TILE_MASK,
                            WebkitMaskImage: TILE_MASK,
                            maskSize: '100% 100%',
                            WebkitMaskSize: '100% 100%',
                            maskRepeat: 'no-repeat',
                            WebkitMaskRepeat: 'no-repeat',
                        }}
                    >
                        <div
                            className="absolute"
                            style={{
                                left: '12.037%',
                                top: '11.009%',
                                width: '74.074%',
                                height: '73.394%',
                                borderRadius: '30%',
                                background: palette.protonTile,
                                boxShadow: palette.tileShadow,
                            }}
                        >
                            <svg
                                viewBox="0 0 36 36"
                                fill="none"
                                className="absolute block"
                                style={{ left: '13.75%', top: '13.75%', width: '72%', height: '72%' }}
                            >
                                <path fill={`url(#pd-a-${uid})`} d="m4 9 4-2 7 4h12v17l-1 1H7a3 3 0 0 1-3-3V9Z" />
                                <path
                                    fill={`url(#pd-b-${uid})`}
                                    fillRule="evenodd"
                                    clipRule="evenodd"
                                    d="M14.961 7.426A3 3 0 0 0 16.726 8H29a3 3 0 0 1 3 3v15a3 3 0 0 1-3 3h-3V14.5a2.5 2.5 0 0 0-2.5-2.5H13a3 3 0 0 1-1.8-.6L8.8 9.6A3 3 0 0 0 7 9H4a3 3 0 0 1 3-3h5.024a3 3 0 0 1 1.765.574l1.172.852Z"
                                />
                                <defs>
                                    <radialGradient
                                        id={`pd-a-${uid}`}
                                        cx="0"
                                        cy="0"
                                        r="1"
                                        gradientTransform="matrix(42.9176 0 0 45.5519 28.926 -8.114)"
                                        gradientUnits="userSpaceOnUse"
                                    >
                                        <stop offset=".556" stopColor="#6D4AFF" />
                                        <stop offset="1" stopColor="#FF50C3" />
                                    </radialGradient>
                                    <linearGradient
                                        id={`pd-b-${uid}`}
                                        x1="3.631"
                                        y1="-6.003"
                                        x2="38.345"
                                        y2="32.431"
                                        gradientUnits="userSpaceOnUse"
                                    >
                                        <stop stopColor="#7341FF" />
                                        <stop offset=".359" stopColor="#B487FF" />
                                        <stop offset="1" stopColor="#FFC8FF" />
                                    </linearGradient>
                                </defs>
                            </svg>
                        </div>
                    </div>

                    <div
                        className="absolute"
                        style={{ left: pctX(288), top: pctY(108), width: pctX(36), height: pctY(36) }}
                    >
                        <svg viewBox="0 0 36 36" fill="none" className="absolute inset-0 w-full h-full block">
                            <circle cx="18" cy="18" r="18" fill={palette.badge} />
                        </svg>
                    </div>

                    <div
                        className="absolute"
                        style={{ left: pctX(298), top: pctY(118), width: pctX(16), height: pctY(16) }}
                    >
                        <svg viewBox="0 0 16 16" fill="none" className="absolute inset-0 w-full h-full block">
                            <path
                                fillRule="evenodd"
                                clipRule="evenodd"
                                d="M16 13.6V4.5C16 3.7268 15.403 3.1 14.6667 3.1H8.75556C8.40936 3.1 8.07251 2.9821 7.79556 2.764L5.91111 1.28C5.68032 1.09825 5.3996 1 5.11111 1H1.33333C0.596954 1 0 1.6268 0 2.4V13.6C0 14.3732 0.596954 15 1.33333 15H14.6667C15.403 15 16 14.3732 16 13.6Z"
                                fill={palette.badgeGlyph}
                            />
                        </svg>
                    </div>

                    <div
                        className="absolute"
                        style={{ left: pctX(298), top: pctY(121), width: pctX(16), height: pctY(12) }}
                    >
                        <div
                            className="absolute overflow-hidden"
                            style={{
                                left: '50%',
                                top: '50%',
                                width: '75%',
                                height: '133.333%',
                                transform: 'translate(-50%, -50%) rotate(90deg)',
                            }}
                        >
                            <div
                                ref={downloadRef}
                                className="absolute"
                                style={{
                                    left: '50%',
                                    top: '50%',
                                    width: '49.983%',
                                    height: '37.5%',
                                    transform: 'translate(-50%, -50%)',
                                }}
                            >
                                <div
                                    className="absolute inset-0 w-full h-full block"
                                    style={{ transform: 'scaleX(-1)' }}
                                >
                                    <div className="absolute" style={{ inset: '-4.17%' }}>
                                        <svg
                                            viewBox="0 0 6.49826 6.5"
                                            fill="none"
                                            className="absolute inset-0 w-full h-full block"
                                        >
                                            <path
                                                fillRule="evenodd"
                                                clipRule="evenodd"
                                                d="M3.40654 0.323837C3.50383 0.421805 3.50328 0.580095 3.40532 0.677388L1.06656 3H5.99826C6.13634 3 6.24826 3.11193 6.24826 3.25C6.24826 3.38807 6.13634 3.5 5.99826 3.5H1.06656L3.40532 5.82261C3.50328 5.9199 3.50383 6.0782 3.40654 6.17616C3.30925 6.27413 3.15096 6.27468 3.05299 6.17739L0.354832 3.49785C0.2996 3.443 0.266532 3.37436 0.255628 3.30299C0.251941 3.28591 0.25 3.26818 0.25 3.25C0.25 3.23182 0.251941 3.21409 0.255627 3.19701C0.266531 3.12564 0.299599 3.057 0.354831 3.00215L3.05299 0.322612C3.15096 0.22532 3.30925 0.225868 3.40654 0.323837Z"
                                                fill={palette.badgeArrow}
                                                stroke={palette.badgeArrow}
                                                strokeWidth="0.5"
                                                strokeLinecap="round"
                                            />
                                        </svg>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
