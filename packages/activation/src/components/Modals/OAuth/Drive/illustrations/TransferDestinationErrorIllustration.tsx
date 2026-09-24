import type { CSSProperties } from 'react';
import { useId } from 'react';

import { useTheme } from '@proton/components';

const FRAME_W = 360;
const FRAME_H = 188;
const u = (v: number) => `${((v / FRAME_W) * 100).toFixed(4)}cqw`;

const TILE = 65.185;
const TILE_CY = 94.96;
const LEFT_CX = 118.595;
const RIGHT_CX = 241.38;
const TILE_TOP = TILE_CY - TILE / 2;
const BADGED_TILE_LEFT = RIGHT_CX - TILE / 2;
const PLAIN_TILE_LEFT = LEFT_CX - TILE / 2;

const MASK_W = 88;
const MASK_H = 88.814;
const MASK_DX = 10.592;
const MASK_DY = 9.777;

const BADGE = 29.3333;
const BADGE_DX = 42.3625;
const BADGE_DY = 43.6925;

const ARROW_W = 106;
const ARROW_H = 28;
const ARROW_TOP = 81;

const DOT_PITCH = 17;
const DOT_RADIUS = 1.5;
const DOTS_W = 421;
const DOTS_H = 192;
const DOTS_CX = 179.5;
const DOTS_CY = 94;
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

const TILE_MASK =
    "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 108 109'%3E%3Cpath d='M108 79.7148L97.1426 68.8574C89.3321 61.0469 76.6679 61.0469 68.8574 68.8574C61.0469 76.6679 61.0469 89.3321 68.8574 97.1426L80.7148 109H0V0H108V79.7148Z' fill='%23000'/%3E%3C/svg%3E\")";

interface Palette {
    badgedTile: string;
    plainTile: string;
    tileShadow: string;
    arrow: string;
    arrowOpacity: number;
    badgeDisc: string;
    badgeFolder: string;
    badgeGlyph: string;
    dots: string;
}

const LIGHT_PALETTE: Palette = {
    badgedTile: '#F7F7F7',
    plainTile: 'linear-gradient(to bottom, #FFFFFF, #F5F5F5)',
    tileShadow: `0 ${u(0.815)} ${u(1.63)} rgba(0,0,0,0.05), inset 0 0 ${u(1.222)} rgba(195,195,195,0.4), inset 0 ${u(14.667)} ${u(17.926)} #FFFFFF`,
    arrow: '#6D4AFF',
    arrowOpacity: 0.5,
    badgeDisc: '#FFE4E7',
    badgeFolder: '#F2364E',
    badgeGlyph: '#FFFFFF',
    dots: '#EBEBFA',
};

const DARK_PALETTE: Palette = {
    badgedTile: '#0B0B0C',
    plainTile: '#0B0B0C',
    tileShadow: `0 ${u(0.815)} ${u(1.63)} rgba(0,0,0,0.6), inset 0 0 ${u(1.222)} rgba(255,255,255,0.4), inset 0 ${u(14.667)} ${u(17.926)} #2C2C2C`,
    arrow: '#8A6EFF',
    arrowOpacity: 1,
    badgeDisc: '#432429',
    badgeFolder: '#F2364E',
    badgeGlyph: '#FFFFFF',
    dots: 'rgba(255,255,255,0.107)',
};

const GoogleDriveMark = ({ uid }: { uid: string }) => (
    <svg
        viewBox="0 0 42 39"
        fill="none"
        className="absolute block"
        style={{ left: '50%', top: '50.625%', transform: 'translate(-50%, -50%)', width: '52.5%', height: '48.75%' }}
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
);

const ProtonDriveMark = ({ uid }: { uid: string }) => (
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
);

export const TransferDestinationErrorIllustration = () => {
    const { information } = useTheme();
    const palette = information.dark ? DARK_PALETTE : LIGHT_PALETTE;

    const uid = useId().replace(/[^a-zA-Z0-9]/g, '');

    const tileFace = (background: string): CSSProperties => ({
        borderRadius: '30%',
        background,
        boxShadow: palette.tileShadow,
    });

    return (
        <div
            className="block w-full relative overflow-hidden shrink-0"
            style={{ aspectRatio: `${FRAME_W} / ${FRAME_H}`, containerType: 'inline-size', isolation: 'isolate' }}
            aria-hidden="true"
        >
            <div
                className="absolute"
                style={{
                    left: u(DOTS_CX),
                    top: u(DOTS_CY),
                    width: u(DOTS_W),
                    height: u(DOTS_H),
                    transform: 'translate(-50%, -50%)',
                    maskImage: 'radial-gradient(ellipse at center, #000 65.57%, transparent 100%)',
                    WebkitMaskImage: 'radial-gradient(ellipse at center, #000 65.57%, transparent 100%)',
                }}
            >
                <svg viewBox={`0 0 ${DOTS_W} ${DOTS_H}`} fill="none" className="absolute inset-0 w-full h-full block">
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
                    transform: 'translateX(-50%)',
                    top: u(ARROW_TOP),
                    width: u(ARROW_W),
                    height: u(ARROW_H),
                    opacity: palette.arrowOpacity,
                }}
            >
                <div
                    className="absolute"
                    style={{ left: '38.679%', top: '7.143%', width: '22.642%', height: '85.714%' }}
                >
                    <svg viewBox="0 0 24 24" fill="none" className="absolute inset-0 w-full h-full block">
                        <path
                            fillRule="evenodd"
                            clipRule="evenodd"
                            d="M11.5252 3.97118C11.2333 4.26509 11.235 4.73996 11.5289 5.03184L18.5451 11.9997L3.75002 11.9997C3.33581 11.9997 3.00002 12.3355 3.00002 12.7497C3.00002 13.1639 3.33581 13.4997 3.75002 13.4997L18.5451 13.4997L11.5289 20.4675C11.235 20.7594 11.2333 21.2343 11.5252 21.5282C11.8171 21.8221 12.2919 21.8237 12.5858 21.5318L20.6803 13.4932C20.846 13.3287 20.9452 13.1228 20.9779 12.9087C20.989 12.8574 20.9948 12.8042 20.9948 12.7497C20.9948 12.6951 20.989 12.6419 20.9779 12.5907C20.9452 12.3766 20.846 12.1707 20.6803 12.0061L12.5858 3.96751C12.2919 3.67563 11.8171 3.67728 11.5252 3.97118Z"
                            fill={palette.arrow}
                        />
                    </svg>
                </div>
            </div>

            <div
                className="absolute overflow-hidden"
                style={{
                    left: u(PLAIN_TILE_LEFT),
                    top: u(TILE_TOP),
                    width: u(TILE),
                    height: u(TILE),
                    ...tileFace(palette.plainTile),
                }}
            >
                <ProtonDriveMark uid={uid} />
            </div>

            <div
                className="absolute"
                style={{
                    left: u(BADGED_TILE_LEFT - MASK_DX),
                    top: u(TILE_TOP - MASK_DY),
                    width: u(MASK_W),
                    height: u(MASK_H),
                    maskImage: TILE_MASK,
                    WebkitMaskImage: TILE_MASK,
                    maskSize: '100% 100%',
                    WebkitMaskSize: '100% 100%',
                    maskRepeat: 'no-repeat',
                    WebkitMaskRepeat: 'no-repeat',
                }}
            >
                <div
                    className="absolute overflow-hidden"
                    style={{
                        left: `${((MASK_DX / MASK_W) * 100).toFixed(3)}%`,
                        top: `${((MASK_DY / MASK_H) * 100).toFixed(3)}%`,
                        width: `${((TILE / MASK_W) * 100).toFixed(3)}%`,
                        height: `${((TILE / MASK_H) * 100).toFixed(3)}%`,
                        ...tileFace(palette.badgedTile),
                    }}
                >
                    <GoogleDriveMark uid={uid} />
                </div>
            </div>

            <div
                className="absolute"
                style={{
                    left: u(BADGED_TILE_LEFT + BADGE_DX),
                    top: u(TILE_TOP + BADGE_DY),
                    width: u(BADGE),
                    height: u(BADGE),
                }}
            >
                <svg viewBox="0 0 29.3333 29.3333" fill="none" className="absolute inset-0 w-full h-full block">
                    <circle cx="14.6667" cy="14.6666" r="14.6666" fill={palette.badgeDisc} />
                    <path
                        fillRule="evenodd"
                        clipRule="evenodd"
                        d="M21.1852 19.2295V11.8147C21.1852 11.1847 20.6988 10.674 20.0988 10.674H15.2823C15.0002 10.674 14.7258 10.5779 14.5001 10.4002L12.9646 9.19103C12.7766 9.04293 12.5479 8.96288 12.3128 8.96288H9.23461C8.6346 8.96288 8.14819 9.47361 8.14819 10.1036V19.2295C8.14819 19.8595 8.6346 20.3703 9.23461 20.3703H20.0988C20.6988 20.3703 21.1852 19.8595 21.1852 19.2295Z"
                        fill={palette.badgeFolder}
                    />
                    <path
                        d="M14.6695 17.4105C14.921 17.4105 15.1252 17.6172 15.1253 17.8719C15.1253 18.1266 14.9211 18.3332 14.6695 18.3333H14.6637C14.4122 18.3332 14.2079 18.1266 14.2079 17.8719C14.208 17.6172 14.4122 17.4106 14.6637 17.4105H14.6695ZM13.5652 12.9205C13.9893 12.6683 14.4879 12.5757 14.9727 12.6599C15.4575 12.7441 15.8974 12.9997 16.2142 13.3806C16.5308 13.7615 16.7043 14.2433 16.7037 14.7411L16.6967 14.8865C16.6313 15.6003 16.0945 16.0853 15.6872 16.3602C15.4562 16.5161 15.228 16.6313 15.0598 16.707C14.975 16.7452 14.9037 16.7742 14.8525 16.7939C14.8271 16.8037 14.8064 16.8111 14.7915 16.8164C14.7841 16.8191 14.7776 16.8213 14.7731 16.8229C14.771 16.8236 14.7694 16.8243 14.768 16.8248L14.7661 16.8254L14.7655 16.8261C14.5267 16.9066 14.2678 16.7756 14.1882 16.5339C14.1089 16.2924 14.2377 16.0315 14.4762 15.9509C14.4779 15.9503 14.4819 15.9486 14.4864 15.947C14.4953 15.9438 14.5097 15.9388 14.5283 15.9316C14.5662 15.917 14.6221 15.8945 14.6898 15.864C14.8267 15.8024 15.0054 15.7111 15.1812 15.5924C15.5605 15.3365 15.7921 15.0453 15.7921 14.7411C15.7925 14.4609 15.6951 14.1889 15.5169 13.9746C15.3387 13.7604 15.0915 13.6166 14.8189 13.5692C14.5461 13.5218 14.2653 13.574 14.0268 13.7159C13.7883 13.8578 13.6069 14.0805 13.515 14.3446C13.4315 14.585 13.1714 14.7117 12.934 14.6272C12.6967 14.5426 12.5722 14.2792 12.6556 14.039C12.8188 13.5692 13.1411 13.1728 13.5652 12.9205Z"
                        fill={palette.badgeGlyph}
                    />
                </svg>
            </div>
        </div>
    );
};
