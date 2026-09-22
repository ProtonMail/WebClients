import type { CSSProperties } from 'react';
import { useEffect, useId, useRef, useState } from 'react';

import { useTheme } from '@proton/components';
import { MotionModeSetting } from '@proton/shared/lib/themes/constants';

interface Palette {
    pageStroke: string;
    starFill: string;
    lineColor: string;
    cornerFill: string;
    cornerStroke: string;
    pgBackFrom: string;
    pgBackTo: string;
    pgFrontFrom: string;
    pgFrontTo: string;
    shadowFill: string;
}

const LIGHT_PALETTE: Palette = {
    pageStroke: '#E9E9E9',
    starFill: '#CCCCCC',
    lineColor: '#DCDCDC',
    cornerFill: '#F6F6F6',
    cornerStroke: '#E9E9E9',
    pgBackFrom: '#F6F6F7',
    pgBackTo: '#E8E9EB',
    pgFrontFrom: '#E8E9EB',
    pgFrontTo: '#F6F6F7',
    shadowFill: '#808080',
};

const DARK_PALETTE: Palette = {
    pageStroke: '#3B3A45',
    starFill: '#5B596A',
    lineColor: '#4A4856',
    cornerFill: '#2B2A33',
    cornerStroke: '#3B3A45',
    pgBackFrom: '#2C2B35',
    pgBackTo: '#211F28',
    pgFrontFrom: '#211F28',
    pgFrontTo: '#2C2B35',
    shadowFill: '#000000',
};

const FRAME_W = 379;
const FRAME_H = 267;
const SETTLE = 'cubic-bezier(.22,.9,.24,1)';

const containerStyle: CSSProperties = {
    display: 'block',
    width: '100%',
    maxWidth: FRAME_W,
    aspectRatio: `${FRAME_W} / ${FRAME_H}`,
    position: 'relative',
    flexShrink: 0,
};

/** The element's current rotation in degrees, 0–360, read off its transform. */
function currentAngle(el: Element) {
    const t = getComputedStyle(el).transform;
    if (!t || t === 'none') {
        return 0;
    }
    const m = new DOMMatrixReadOnly(t);
    return ((Math.atan2(m.b, m.a) * 180) / Math.PI + 360) % 360;
}

const star =
    'M143.531 50.2673C143.692 49.8319 144.308 49.8319 144.469 50.2673L146.621 56.0835C146.672 56.2203 146.78 56.3282 146.917 56.3789L152.733 58.5311C153.168 58.6922 153.168 59.3078 152.733 59.4689L146.917 61.6211C146.78 61.6718 146.672 61.7797 146.621 61.9165L144.469 67.7327C144.308 68.1681 143.692 68.1681 143.531 67.7327L141.379 61.9165C141.328 61.7797 141.22 61.6718 141.083 61.6211L135.267 59.4689C134.832 59.3078 134.832 58.6922 135.267 58.5311L141.083 56.3789C141.22 56.3282 141.328 56.2203 141.379 56.0835L143.531 50.2673Z';

export const EmptyFolderIllustration = () => {
    const [hover, setHover] = useState(false);
    const { information } = useTheme();
    const starRef = useRef<SVGGElement>(null);
    const shimmerRef = useRef<SVGGElement>(null);
    const spinRef = useRef<Animation | null>(null);
    // Stripped to alphanumerics so the value is safe inside `url(#…)`, which is
    // parsed as CSS and would choke on the colons React 18's useId emits.
    const uid = useId().replace(/[^a-zA-Z0-9]/g, '');

    const areAnimationsEnabled =
        information.motionMode !== MotionModeSetting.Reduce && !information.features.animations;
    const isOpen = hover && areAnimationsEnabled;
    const palette = information.dark ? DARK_PALETTE : LIGHT_PALETTE;

    useEffect(() => {
        const el = shimmerRef.current;
        if (!el || !isOpen) {
            return;
        }
        // Only the ends carry a transform, so the travel interpolates across the
        // whole sweep while the two opacity stops hold it lit through the middle.
        const anim = el.animate(
            [
                { offset: 0, transform: 'translate(-26px, -26px)', opacity: 0 },
                { offset: 0.12, opacity: 1 },
                { offset: 0.7, opacity: 1 },
                { offset: 1, transform: 'translate(14px, 14px)', opacity: 0 },
            ],
            { duration: 1900, delay: 120, iterations: Infinity, easing: 'cubic-bezier(.4,0,.5,1)' }
        );
        return () => anim.cancel();
    }, [isOpen]);

    useEffect(
        () => () => {
            spinRef.current?.cancel();
            spinRef.current = null;
        },
        []
    );

    const stopSpin = () => {
        if (spinRef.current) {
            spinRef.current.cancel();
            spinRef.current = null;
        }
    };

    const spin = () => {
        const el = starRef.current;
        if (!el) {
            return;
        }
        // Read the angle *before* cancelling. A settle still in flight is holding
        // its pose with `fill: 'forwards'`, and that pose is where the new spin has
        // to begin — cancel first and the sparkle snaps back to 0 on re-entry.
        const from = currentAngle(el);
        stopSpin();
        el.style.transform = 'none';
        if (!areAnimationsEnabled) {
            return;
        }
        spinRef.current = el.animate([{ transform: `rotate(${from}deg)` }, { transform: `rotate(${from + 360}deg)` }], {
            duration: 5000,
            iterations: Infinity,
            easing: 'linear',
        });
    };

    const unspin = () => {
        const el = starRef.current;
        if (!el) {
            return;
        }
        const from = currentAngle(el);
        stopSpin();
        // The sparkle is 4-point symmetric, so the nearest quarter turn already
        // *looks* like 0°. Settling there rather than unwinding all the way home
        // keeps the stop under half a second from any angle.
        const to = Math.round(from / 90) * 90;
        const delta = Math.abs(to - from);
        const back = el.animate([{ transform: `rotate(${from}deg)` }, { transform: `rotate(${to}deg)` }], {
            duration: 260 + (delta / 90) * 340,
            easing: SETTLE,
            fill: 'forwards',
        });
        spinRef.current = back;
        back.onfinish = () => {
            // Hand the pose back to the stylesheet before dropping the animation:
            // cancelling discards the fill, and `none` is indistinguishable from a
            // quarter-turn multiple on a symmetric shape.
            el.style.transform = 'none';
            if (spinRef.current === back) {
                stopSpin();
            }
        };
    };

    const enter = () => {
        setHover(true);
        spin();
    };

    const leave = () => {
        setHover(false);
        unspin();
    };

    const frontT = isOpen ? 'translate(-20.2px, 16.2px) rotate(-6.46deg)' : 'none';
    const backT = isOpen ? 'translate(17.55px, -3.16px) rotate(6.61deg)' : 'none';

    return (
        <div onMouseEnter={enter} onMouseLeave={leave} style={containerStyle}>
            <svg
                viewBox={`0 0 ${FRAME_W} ${FRAME_H}`}
                width="100%"
                height="100%"
                fill="none"
                aria-hidden="true"
                style={{ display: 'block', overflow: 'visible' }}
            >
                {/* The back stack. Rotated in place, so the origin is its own
                    top-left corner rather than the drawing's. */}
                <g
                    style={{
                        transformBox: 'view-box',
                        transformOrigin: '175.27px 49.3062px',
                        transition: `transform 640ms ${SETTLE}`,
                        transform: backT,
                    }}
                >
                    <rect
                        x="175.27"
                        y="49.3062"
                        width="98.5"
                        height="123.5"
                        rx="5.75"
                        transform="rotate(15 175.27 49.3062)"
                        fill={`url(#pgBack-${uid})`}
                        stroke={palette.pageStroke}
                        strokeWidth="0.5"
                    />
                </g>

                {/* The front stack — cover, ruled lines, and the turned corner. */}
                <g
                    style={{
                        transformBox: 'view-box',
                        transformOrigin: '0 0',
                        transition: `transform 640ms ${SETTLE}`,
                        transform: frontT,
                    }}
                >
                    <g filter={`url(#bookShadow-${uid})`}>
                        <path
                            d="M134.411 81.0042L115.409 110.819L135.522 201.618C135.866 203.172 136.813 204.525 138.155 205.38C139.497 206.236 141.124 206.523 142.678 206.179L227.619 187.363C229.172 187.019 230.526 186.072 231.381 184.73C232.236 183.388 232.523 181.761 232.179 180.208L207.957 70.8583C207.613 69.3046 206.666 67.9513 205.324 67.0961C203.982 66.2409 202.355 65.9537 200.801 66.2979L134.411 81.0042Z"
                            fill={`url(#pgFront-${uid})`}
                        />
                        <path
                            d="M200.855 66.542C202.344 66.2122 203.903 66.4878 205.189 67.3074C206.475 68.127 207.383 69.4234 207.713 70.9123L231.935 180.262C232.265 181.751 231.989 183.309 231.17 184.595C230.35 185.881 229.054 186.789 227.565 187.119L142.624 205.935C141.135 206.264 139.576 205.989 138.29 205.169C137.004 204.35 136.096 203.053 135.766 201.564L115.676 110.866L134.566 81.2259L200.855 66.542Z"
                            stroke={palette.pageStroke}
                            strokeWidth="0.5"
                        />
                    </g>
                    <path
                        d="M139.434 156.039L139.074 154.411C138.954 153.872 139.054 153.307 139.351 152.841C139.648 152.375 140.118 152.046 140.657 151.927C141.197 151.807 141.762 151.907 142.228 152.204C142.694 152.501 143.022 152.971 143.142 153.51L143.502 155.137M138.621 156.219L144.316 154.957C144.765 154.858 145.21 155.141 145.31 155.591L145.941 158.438C146.04 158.888 145.757 159.333 145.307 159.432L139.612 160.694C139.163 160.793 138.718 160.51 138.618 160.06L137.987 157.213C137.888 156.763 138.171 156.318 138.621 156.219Z"
                        stroke={palette.lineColor}
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    />
                    <path
                        d="M139.705 170.745C139.585 170.206 139.925 169.672 140.465 169.552L182.447 160.253C182.986 160.133 183.52 160.473 183.64 161.013C183.759 161.552 183.419 162.086 182.88 162.205L140.897 171.505C140.358 171.624 139.824 171.284 139.705 170.745Z"
                        fill={palette.lineColor}
                    />
                    <path
                        d="M141.867 180.508C141.748 179.969 142.088 179.435 142.627 179.316L166.059 174.125C166.599 174.006 167.133 174.346 167.252 174.885C167.371 175.424 167.031 175.958 166.492 176.078L143.06 181.268C142.521 181.388 141.987 181.047 141.867 180.508Z"
                        fill={palette.lineColor}
                    />
                    <path
                        d="M144.03 190.271C143.911 189.732 144.251 189.198 144.79 189.079L177.009 181.942C177.548 181.823 178.082 182.163 178.202 182.702C178.321 183.241 177.981 183.775 177.442 183.895L145.223 191.032C144.683 191.151 144.149 190.811 144.03 190.271Z"
                        fill={palette.lineColor}
                    />
                    <path
                        d="M138.276 99.6086C138.962 102.709 137.006 105.779 133.905 106.466L115.944 110.445L134.297 81.6475L138.276 99.6086Z"
                        fill={palette.cornerFill}
                        stroke={palette.cornerStroke}
                        strokeWidth="0.5"
                    />
                </g>

                {/* Contact shadow. Drawn over the book, not under it — it is what
                    makes the bottom edge sit on the surface instead of floating in
                    front of it. Widens as the pages spread. */}
                <g
                    opacity="0.8"
                    filter={`url(#groundBlur-${uid})`}
                    style={{
                        transformBox: 'view-box',
                        transformOrigin: '193px 220px',
                        transition: `opacity 640ms ease, transform 640ms ${SETTLE}`,
                        transform: isOpen ? 'scale(1.06, 1)' : 'none',
                    }}
                >
                    <ellipse cx="193" cy="220" rx="46" ry="4" fill={palette.shadowFill} fillOpacity="0.3" />
                </g>

                {/* The sparkle. Two nested groups on purpose: the outer one carries
                    the hover scale through React, the inner one is handed to WAAPI
                    for the rotation. One element doing both would have the spin
                    overwrite the scale on its first frame. */}
                <g
                    style={{
                        transformBox: 'view-box',
                        transformOrigin: '144px 59px',
                        transition: `transform 500ms ${SETTLE}, opacity 500ms ease`,
                        opacity: 0.5,
                        transform: isOpen ? 'scale(1.18)' : 'scale(1)',
                    }}
                >
                    <g ref={starRef} style={{ transformBox: 'view-box', transformOrigin: '144px 59px' }}>
                        <path d={star} fill={palette.starFill} />
                        <g mask={`url(#starMask-${uid})`}>
                            {/* Base opacity 0: with no sweep running the sparkle is simply
                                unlit, which is also what reduced motion should look like. */}
                            <g ref={shimmerRef} filter={`url(#shimmerBlur-${uid})`} style={{ opacity: 0 }}>
                                <rect
                                    x="152.186"
                                    y="48.0942"
                                    width="4.5618"
                                    height="27"
                                    transform="rotate(45 152.186 48.0942)"
                                    fill="white"
                                />
                            </g>
                        </g>
                    </g>
                </g>

                <defs>
                    <mask
                        id={`starMask-${uid}`}
                        style={{ maskType: 'alpha' }}
                        maskUnits="userSpaceOnUse"
                        x="134"
                        y="49"
                        width="20"
                        height="20"
                    >
                        <path d={star} fill="white" />
                    </mask>
                    <filter
                        id={`bookShadow-${uid}`}
                        x="107.409"
                        y="54.1559"
                        width="136.912"
                        height="160.165"
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
                        <feOffset dx="2" dy="-2" />
                        <feGaussianBlur stdDeviation="5" />
                        <feComposite in2="hardAlpha" operator="out" />
                        <feColorMatrix type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.05 0" />
                        <feBlend mode="normal" in2="BackgroundImageFix" result="effect1_dropShadow" />
                        <feBlend mode="normal" in="SourceGraphic" in2="effect1_dropShadow" result="shape" />
                    </filter>
                    <filter
                        id={`groundBlur-${uid}`}
                        x="135"
                        y="204"
                        width="116"
                        height="32"
                        filterUnits="userSpaceOnUse"
                        colorInterpolationFilters="sRGB"
                    >
                        <feFlood floodOpacity="0" result="BackgroundImageFix" />
                        <feBlend mode="normal" in="SourceGraphic" in2="BackgroundImageFix" result="shape" />
                        <feGaussianBlur stdDeviation="6" result="effect1_foregroundBlur" />
                    </filter>
                    <filter
                        id={`shimmerBlur-${uid}`}
                        x="131.094"
                        y="46.0942"
                        width="26.3176"
                        height="26.3176"
                        filterUnits="userSpaceOnUse"
                        colorInterpolationFilters="sRGB"
                    >
                        <feFlood floodOpacity="0" result="BackgroundImageFix" />
                        <feBlend mode="normal" in="SourceGraphic" in2="BackgroundImageFix" result="shape" />
                        <feGaussianBlur stdDeviation="1" result="effect1_foregroundBlur" />
                    </filter>
                    <linearGradient
                        id={`pgBack-${uid}`}
                        x1="297.255"
                        y1="88.4446"
                        x2="208.206"
                        y2="79.7597"
                        gradientUnits="userSpaceOnUse"
                    >
                        <stop stopColor={palette.pgBackFrom} />
                        <stop offset="1" stopColor={palette.pgBackTo} />
                    </linearGradient>
                    <linearGradient
                        id={`pgFront-${uid}`}
                        x1="126.002"
                        y1="96.9965"
                        x2="178.998"
                        y2="175.499"
                        gradientUnits="userSpaceOnUse"
                    >
                        <stop stopColor={palette.pgFrontFrom} />
                        <stop offset="1" stopColor={palette.pgFrontTo} />
                    </linearGradient>
                </defs>
            </svg>
        </div>
    );
};
