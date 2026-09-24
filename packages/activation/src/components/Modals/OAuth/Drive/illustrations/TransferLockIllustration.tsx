import { useEffect, useId, useRef } from 'react';

import { useTheme } from '@proton/components';
import { MotionModeSetting } from '@proton/shared/lib/themes/constants';

const FRAME_W = 360;
const FRAME_H = 188;
const STAGE_W = 360;
const STAGE_H = 189;
const pctX = (px: number) => `${(px / STAGE_W) * 100}%`;
const pctY = (px: number) => `${(px / STAGE_H) * 100}%`;

const SUBJECT_SCALE = 0.8;

const offstage = (rendersAt: number, centre: number) => centre + (rendersAt - centre) / SUBJECT_SCALE;

const FOLDER_OFFSTAGE_X = offstage(376, STAGE_W / 2);

interface Palette {
    googleTile: string;
    protonTile: string;
    tileShadow: string;
    arrow: string;
    arrowOpacity: number;
    lock: string;
    lockLight: string;
    surface: string;
    cursor: string;
    cursorRim: string;
    button: string;
    dots: string;
}

const LIGHT_PALETTE: Palette = {
    googleTile: 'linear-gradient(to bottom, #FFFFFF, #F5F5F5)',
    protonTile: '#F7F7F7',
    tileShadow: '0px 1px 2px rgba(0,0,0,0.05), inset 0px 0px 1.5px rgba(195,195,195,0.4), inset 0px 18px 22px #FFFFFF',
    arrow: '#6D4AFF',
    arrowOpacity: 0.5,
    lock: '#39BA71',
    lockLight: '#E7FEE9',
    surface: '#FFFFFF',
    cursor: '#16161A',
    cursorRim: '#FFFFFF',
    button: '#FFFFFF',
    dots: '#EBEBFA',
};

const DARK_PALETTE: Palette = {
    googleTile: '#0B0B0C',
    protonTile: '#0B0B0C',
    tileShadow: '0px 1px 2px rgba(0,0,0,0.6), inset 0px 0px 1.5px rgba(255,255,255,0.4), inset 0px 18px 22px #2C2C2C',
    arrow: '#8A6EFF',
    arrowOpacity: 1,
    lock: '#39BA71',
    lockLight: '#143627',
    surface: '#000000',
    cursor: '#F5F5F5',
    cursorRim: '#0B0B0C',
    button: '#1F1F26',
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

const ARROW_BOX = 24;

const ICON_SCALE = 0.78;
const bandX = (px: number) => `${(px / BAND_W) * 100}%`;
const bandY = (px: number) => `${(px / BAND_H) * 100}%`;

const LANES = [
    { y: 95, scale: 1, opacity: 1, dur: 300 },
    { y: 87, scale: 0.9, opacity: 0.82, dur: 330 },
    { y: 103, scale: 0.9, opacity: 0.82, dur: 335 },
    { y: 79, scale: 0.8, opacity: 0.68, dur: 360 },
    { y: 111, scale: 0.8, opacity: 0.68, dur: 365 },
    { y: 71, scale: 0.68, opacity: 0.52, dur: 400 },
    { y: 119, scale: 0.68, opacity: 0.52, dur: 405 },
] as const;

const WAVES = [
    [
        [5, 340, 'docs', 1.06],
        [3, 370, 'folder', 0.9],
        [6, 400, 'pdf', 1.12],
        [1, 430, 'sheets', 0.94],
        [4, 460, 'zip', 1.0],
        [2, 490, 'docs', 0.88],
        [0, 520, 'folder', 1.08],
    ],
    [
        [6, 780, 'sheets', 0.92],
        [4, 810, 'pdf', 1.04],
        [2, 840, 'folder', 1.14],
        [5, 870, 'docs', 0.9],
        [1, 900, 'zip', 1.02],
        [3, 930, 'sheets', 1.1],
        [0, 960, 'pdf', 0.96],
    ],
    [
        [6, 1220, 'folder', 1.08],
        [3, 1250, 'docs', 0.92],
        [1, 1280, 'zip', 1.06],
        [5, 1310, 'sheets', 0.98],
        [2, 1340, 'pdf', 1.12],
        [4, 1370, 'docs', 0.9],
        [0, 1400, 'sheets', 1.0],
    ],
] as const;

const STILL_AT = 1200;

const ARROWS = WAVES.flatMap((wave) =>
    wave.map(([laneIndex, arrive, icon, size]) => {
        const lane = LANES[laneIndex];
        const box = ARROW_BOX * lane.scale * ICON_SCALE * size;
        const travel = BAND_W + box;

        const launch = arrive - (GAP_OUT / travel) * lane.dur;
        const progress = (STILL_AT - launch) / lane.dur;

        return {
            ...lane,
            icon,
            arrive,
            rest: Math.min(Math.max(-box + progress * travel, -box), BAND_W),
        };
    })
);

const SNAP_AFTER = 10;
const SNAPS = WAVES.map((wave) => Math.max(...wave.map(([, at]) => at)) + SNAP_AFTER);
const GROWTH = [1.06, 1.14, 1.24];

const SNAP_PUNCH = 55;
const SNAP_COUNTER = 110;
const SNAP_SETTLE = 175;
const SNAP_OVERSHOOT = 0.7;

const SHAKE_PERIOD = 55;
const SHAKE_FROM = 0.5;
const SHAKE_TO = 3.2;
const SHAKE_WAVE = [0.62, 0.8, 1];
const TILE_BOX = 80;
const shakePct = (px: number) => (px / TILE_BOX) * 100;

const RELAX_FROM = 2500;
const RELAX_TO = 2920;
const RELAX_SETTLE = 3180;

const CLEAR_FROM = 1700;
const CLEAR_TO = 2180;

const CLEAR_FADED = 2060;

const CENTRE_X = 140;

const LOCK_OUT = 2300;
const LOCK_POP = 2380;
const LOCK_READY = 2440;
const LOCK_SWING = 2500;
const LOCK_SHUT = 2920;
const LOCK_SEATED = 3140;
const LOCK_HOLD = 5640;
const LOCK_GONE = 5760;

const SEAT_SQUASH = 110;
const SEAT_COUNTER = 270;
const SEAT_DONE = 440;
const DISC_POP = 160;
const DISC_DONE = 480;
const RING_DONE = 520;

const SHACKLE_OPEN = 'translate(-10%, 0%) rotate(-45.8deg)';
const SHACKLE_OVERSHOOT = 'translate(2%, 0%) rotate(24.8deg)';
const SHACKLE_SHUT = 'translate(2%, 0%) rotate(22.6deg)';

const CUT_R = 20;
const BADGE_BOX = 36;
const cutInset = `${(((BADGE_BOX / 2 - CUT_R) / BADGE_BOX) * 100).toFixed(3)}%`;
const cutSize = `${((CUT_R * 2) / BADGE_BOX) * 100}%`;

const CURSOR_IN = 600;
const CURSOR_ON_GOOGLE = 1040;

const BUTTON_IN = CURSOR_ON_GOOGLE - 100;
const CURSOR_TO_BUTTON = 1260;
const CURSOR_ON_BUTTON = 1480;
const CURSOR_PRESS = 1860;
const CURSOR_CLICK = 1940;
const BUTTON_OUT = 2020;
const CURSOR_OUT = 2360;

const CURSOR_ENTER_X = 176;

const CURSOR_ENTER_Y = offstage(212, STAGE_H / 2);
const CURSOR_GOOGLE_X = 192;
const CURSOR_GOOGLE_Y = 102;
const CURSOR_X = 251;
const CURSOR_Y = 100;
const CURSOR_SIZE = 20;

const BUTTON_X = 238;
const BUTTON_Y = 77;

const BUTTON_SIZE = 36;

const INTRO_PEEK = CURSOR_ON_BUTTON;
const INTRO_LOOK = 1780;
const INTRO_DRAW_BACK = CURSOR_CLICK;
const INTRO_PUSH = 2200;

const INTRO_CONTACT = 2265;

const INTRO_ABSORB = 2315;

const INTRO_DONE = 2615;

const DURATION = 8835;
const LOOP = { duration: DURATION, iterations: Infinity } as const;

const at = (ms: number) => (INTRO_DONE + ms) / DURATION;
const abs = (ms: number) => ms / DURATION;

const OUTRO_FROM = INTRO_DONE + LOCK_HOLD;
const OUTRO_TO = OUTRO_FROM + 480;

export const TransferLockIllustration = () => {
    const { information } = useTheme();

    const areAnimationsEnabled =
        information.motionMode !== MotionModeSetting.Reduce && !information.features.animations;
    const palette = information.dark ? DARK_PALETTE : LIGHT_PALETTE;

    const uid = useId().replace(/[^a-zA-Z0-9]/g, '');

    const arrowRefs = useRef<(HTMLDivElement | null)[]>([]);
    const googleRef = useRef<HTMLDivElement>(null);
    const introRef = useRef<HTMLDivElement>(null);
    const cursorRef = useRef<HTMLDivElement>(null);
    const clickRef = useRef<HTMLDivElement>(null);
    const buttonRef = useRef<HTMLDivElement>(null);
    const shakeRef = useRef<HTMLDivElement>(null);
    const growRef = useRef<HTMLDivElement>(null);
    const lockRef = useRef<HTMLDivElement>(null);
    const discRef = useRef<HTMLDivElement>(null);
    const bodyRef = useRef<HTMLDivElement>(null);
    const shackleRef = useRef<HTMLDivElement>(null);
    const pulseRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!areAnimationsEnabled) {
            return;
        }

        const google = googleRef.current;
        const intro = introRef.current;
        const cursor = cursorRef.current;
        const click = clickRef.current;
        const button = buttonRef.current;
        const shake = shakeRef.current;
        const grow = growRef.current;
        const lock = lockRef.current;
        const disc = discRef.current;
        const body = bodyRef.current;
        const shackle = shackleRef.current;
        const pulse = pulseRef.current;
        if (
            !google ||
            !intro ||
            !cursor ||
            !click ||
            !button ||
            !shake ||
            !grow ||
            !lock ||
            !disc ||
            !body ||
            !shackle ||
            !pulse
        ) {
            return;
        }

        const animations: Animation[] = [];

        const gx = (stageX: number, scale = 1) =>
            `translateX(${(((stageX - 44) / 80) * 100).toFixed(3)}%) scale(${scale})`;
        const fx = (stageX: number, deg = 0) =>
            `translateX(${(((stageX - 236) / 80) * 100).toFixed(3)}%) rotate(${deg}deg)`;

        animations.push(
            google.animate(
                [
                    { offset: 0, transform: gx(144), easing: 'linear' },
                    { offset: abs(INTRO_PUSH), transform: gx(144), easing: 'linear' },
                    {
                        offset: abs(INTRO_CONTACT),
                        transform: gx(104),
                        easing: 'cubic-bezier(0.33,0.66,0.66,1)',
                    },
                    { offset: abs(INTRO_CONTACT + 190), transform: gx(44), easing: 'linear' },
                    { offset: at(CLEAR_FROM), transform: gx(44), easing: 'cubic-bezier(0.42,0.08,0.62,0.5)' },
                    { offset: at(CLEAR_FADED), transform: gx(44, 0), easing: 'linear' },
                    { offset: abs(OUTRO_FROM), transform: gx(44, 0), easing: 'linear' },
                    { offset: abs(OUTRO_FROM + 120), transform: gx(144), easing: 'linear' },
                    { offset: 1, transform: gx(144) },
                ],
                LOOP
            )
        );

        animations.push(
            google.animate(
                [
                    { offset: 0, opacity: 1, easing: 'linear' },
                    { offset: at(CLEAR_FADED), opacity: 1, easing: 'linear' },
                    { offset: at(CLEAR_FADED + 1), opacity: 0, easing: 'linear' },
                    { offset: abs(OUTRO_FROM + 200), opacity: 0, easing: 'cubic-bezier(0.3,0,0.4,1)' },
                    { offset: abs(OUTRO_TO), opacity: 1, easing: 'linear' },
                    { offset: 1, opacity: 1 },
                ],
                LOOP
            )
        );

        animations.push(
            intro.animate(
                [
                    { offset: 0, transform: fx(FOLDER_OFFSTAGE_X), easing: 'linear' },
                    {
                        offset: abs(INTRO_PEEK),
                        transform: fx(FOLDER_OFFSTAGE_X),
                        easing: 'cubic-bezier(0.22,1,0.36,1)',
                    },
                    { offset: abs(INTRO_PEEK + 160), transform: fx(320, -13), easing: 'ease-in-out' },
                    { offset: abs(INTRO_LOOK), transform: fx(313, -16), easing: 'ease-in-out' },
                    {
                        offset: abs(INTRO_DRAW_BACK),
                        transform: fx(348, -4),
                        easing: 'cubic-bezier(0.32,0,0.8,0.72)',
                    },
                    { offset: abs(INTRO_PUSH), transform: fx(228, -3), easing: 'linear' },
                    { offset: abs(INTRO_CONTACT), transform: fx(188, -3), easing: 'cubic-bezier(0.1,0.62,0.3,1)' },
                    { offset: abs(INTRO_ABSORB), transform: fx(172, -2), easing: 'cubic-bezier(0.37,0,0.63,1)' },
                    { offset: abs(INTRO_DONE), transform: fx(236, 0), easing: 'linear' },
                    { offset: at(CLEAR_FROM), transform: fx(236, 0), easing: 'cubic-bezier(0.4,0.05,0.35,1)' },
                    { offset: at(CLEAR_TO), transform: fx(CENTRE_X, 0), easing: 'linear' },
                    { offset: abs(OUTRO_FROM), transform: fx(CENTRE_X, 0), easing: 'cubic-bezier(0.4,0.05,0.35,1)' },
                    { offset: abs(OUTRO_FROM + 320), transform: fx(FOLDER_OFFSTAGE_X), easing: 'linear' },
                    { offset: 1, transform: fx(FOLDER_OFFSTAGE_X) },
                ],
                LOOP
            )
        );

        ARROWS.forEach((arrow, index) => {
            const node = arrowRefs.current[index];
            if (!node) {
                return;
            }

            const box = ARROW_BOX * arrow.scale;
            const travel = BAND_W + box;

            const delay = arrow.arrive - (GAP_OUT / travel) * arrow.dur;

            const from = `translateX(${(((-box - arrow.rest) / box) * 100).toFixed(3)}%)`;
            const to = `translateX(${(((BAND_W - arrow.rest) / box) * 100).toFixed(3)}%)`;

            const frames: Keyframe[] = [{ offset: 0, transform: from, easing: 'linear' }];
            if (delay > 0) {
                frames.push({ offset: at(delay), transform: from, easing: 'linear' });
            }
            frames.push(
                { offset: at(delay + arrow.dur), transform: to, easing: 'linear' },
                { offset: 1, transform: to }
            );

            animations.push(node.animate(frames, LOOP));
        });

        const shakeFrames: Keyframe[] = [{ offset: 0, transform: 'translate(0%, 0%)', easing: 'linear' }];

        WAVES.forEach((wave, waveIndex) => {
            const arrivals = wave.map(([, ms]) => ms);
            const begin = Math.min(...arrivals);
            const snap = SNAPS[waveIndex];

            shakeFrames.push({ offset: at(begin), transform: 'translate(0%, 0%)', easing: 'linear' });

            let phase = 0;
            for (let ms = begin; ms < snap; ms += SHAKE_PERIOD / 2) {
                const landed = arrivals.filter((a) => a <= ms).length;
                const ceiling = SHAKE_FROM + (SHAKE_TO - SHAKE_FROM) * SHAKE_WAVE[waveIndex];
                const amp = SHAKE_FROM + ((ceiling - SHAKE_FROM) * (landed - 1)) / (arrivals.length - 1);
                const sign = phase % 2 === 0 ? 1 : -1;
                shakeFrames.push({
                    offset: at(ms),
                    transform: `translate(${(shakePct(amp) * sign).toFixed(3)}%, ${(shakePct(amp) * -0.4 * sign).toFixed(3)}%)`,
                    easing: 'linear',
                });
                phase += 1;
            }

            shakeFrames.push({ offset: at(snap), transform: 'translate(0%, 0%)', easing: 'linear' });
        });

        shakeFrames.push({ offset: 1, transform: 'translate(0%, 0%)' });
        animations.push(shake.animate(shakeFrames, LOOP));

        const growFrames: Keyframe[] = [{ offset: 0, transform: 'scale(1, 1)', easing: 'linear' }];

        SNAPS.forEach((snap, step) => {
            const before = step === 0 ? 1 : GROWTH[step - 1];
            const after = GROWTH[step];
            const punch = (SNAP_OVERSHOOT * (after - before)) / before;

            growFrames.push(
                { offset: at(snap), transform: `scale(${before}, ${before})`, easing: 'cubic-bezier(0.15,0,0.1,1)' },
                {
                    offset: at(snap + SNAP_PUNCH),
                    transform: `scale(${(after * (1 + punch)).toFixed(4)}, ${(after * (1 - punch * 0.28)).toFixed(4)})`,
                    easing: 'ease-out',
                },
                {
                    offset: at(snap + SNAP_COUNTER),
                    transform: `scale(${(after * (1 - punch * 0.2)).toFixed(4)}, ${(after * (1 + punch * 0.2)).toFixed(4)})`,
                    easing: 'ease-out',
                },
                { offset: at(snap + SNAP_SETTLE), transform: `scale(${after}, ${after})`, easing: 'linear' }
            );
        });

        const top = GROWTH[GROWTH.length - 1];
        growFrames.push(
            { offset: at(RELAX_FROM), transform: `scale(${top}, ${top})`, easing: 'cubic-bezier(0.4,0.08,0.3,1)' },
            { offset: at(RELAX_TO), transform: 'scale(1.014, 0.988)', easing: 'ease-out' },
            { offset: at(RELAX_SETTLE), transform: 'scale(1, 1)', easing: 'linear' },
            { offset: 1, transform: 'scale(1, 1)' }
        );

        animations.push(grow.animate(growFrames, LOOP));

        const cp = (stageX: number, stageY: number, scale = 1) =>
            `translate(${(((stageX - CURSOR_X) / 20) * 100).toFixed(1)}%, ${(((stageY - CURSOR_Y) / 20) * 100).toFixed(1)}%) scale(${scale})`;

        animations.push(
            cursor.animate(
                [
                    { offset: 0, transform: cp(CURSOR_ENTER_X, CURSOR_ENTER_Y), easing: 'linear' },
                    {
                        offset: abs(CURSOR_IN),
                        transform: cp(CURSOR_ENTER_X, CURSOR_ENTER_Y),
                        easing: 'cubic-bezier(0.28,0.62,0.3,1)',
                    },
                    {
                        offset: abs(CURSOR_ON_GOOGLE),
                        transform: cp(CURSOR_GOOGLE_X, CURSOR_GOOGLE_Y),
                        easing: 'linear',
                    },
                    {
                        offset: abs(CURSOR_TO_BUTTON),
                        transform: cp(CURSOR_GOOGLE_X, CURSOR_GOOGLE_Y),
                        easing: 'cubic-bezier(0.3,0.55,0.35,1)',
                    },
                    { offset: abs(CURSOR_ON_BUTTON), transform: cp(CURSOR_X, CURSOR_Y), easing: 'linear' },
                    { offset: abs(CURSOR_PRESS), transform: cp(CURSOR_X, CURSOR_Y), easing: 'ease-out' },
                    {
                        offset: abs(CURSOR_PRESS + 55),
                        transform: cp(CURSOR_X + 1, CURSOR_Y + 1, 0.86),
                        easing: 'ease-out',
                    },
                    {
                        offset: abs(CURSOR_CLICK),
                        transform: cp(CURSOR_X, CURSOR_Y),
                        easing: 'cubic-bezier(0.4,0,0.7,0.6)',
                    },
                    { offset: abs(CURSOR_OUT), transform: cp(CURSOR_X + 30, CURSOR_Y + 34), easing: 'linear' },
                    { offset: 1, transform: cp(CURSOR_ENTER_X, CURSOR_ENTER_Y) },
                ],
                LOOP
            )
        );

        animations.push(
            cursor.animate(
                [
                    { offset: 0, opacity: 0, easing: 'linear' },
                    { offset: abs(CURSOR_IN), opacity: 0, easing: 'ease-out' },
                    { offset: abs(CURSOR_IN + 110), opacity: 1, easing: 'linear' },
                    { offset: abs(CURSOR_OUT - 220), opacity: 1, easing: 'linear' },
                    { offset: abs(CURSOR_OUT), opacity: 0, easing: 'linear' },
                    { offset: 1, opacity: 0 },
                ],
                LOOP
            )
        );

        animations.push(
            button.animate(
                [
                    { offset: 0, transform: 'scale(0.7)', opacity: 0, easing: 'linear' },
                    {
                        offset: abs(BUTTON_IN),
                        transform: 'scale(0.7)',
                        opacity: 0,
                        easing: 'cubic-bezier(0.22,1,0.36,1)',
                    },
                    { offset: abs(BUTTON_IN + 140), transform: 'scale(1)', opacity: 1, easing: 'linear' },
                    {
                        offset: abs(CURSOR_ON_BUTTON - 60),
                        transform: 'scale(1)',
                        opacity: 1,
                        easing: 'cubic-bezier(0.22,1,0.36,1)',
                    },
                    { offset: abs(CURSOR_ON_BUTTON), transform: 'scale(1.09)', opacity: 1, easing: 'linear' },
                    { offset: abs(CURSOR_PRESS), transform: 'scale(1.09)', opacity: 1, easing: 'ease-out' },
                    { offset: abs(CURSOR_PRESS + 55), transform: 'scale(0.95)', opacity: 1, easing: 'ease-out' },
                    {
                        offset: abs(CURSOR_CLICK),
                        transform: 'scale(1.09)',
                        opacity: 1,
                        easing: 'cubic-bezier(0.4,0,0.7,0.6)',
                    },
                    { offset: abs(BUTTON_OUT), transform: 'scale(0.8)', opacity: 0, easing: 'linear' },
                    { offset: 1, transform: 'scale(0.7)', opacity: 0 },
                ],
                LOOP
            )
        );

        animations.push(
            click.animate(
                [
                    { offset: 0, transform: 'scale(0.25)', opacity: 0, easing: 'linear' },
                    {
                        offset: abs(CURSOR_CLICK - 1),
                        transform: 'scale(0.25)',
                        opacity: 0,
                        easing: 'cubic-bezier(0.22,1,0.36,1)',
                    },
                    {
                        offset: abs(CURSOR_CLICK),
                        transform: 'scale(0.3)',
                        opacity: 0.5,
                        easing: 'cubic-bezier(0.22,1,0.36,1)',
                    },
                    { offset: abs(CURSOR_CLICK + 320), transform: 'scale(2.1)', opacity: 0, easing: 'linear' },
                    { offset: 1, transform: 'scale(0.25)', opacity: 0 },
                ],
                LOOP
            )
        );

        animations.push(
            lock.animate(
                [
                    { offset: 0, transform: 'scale(0)', opacity: 0, easing: 'linear' },
                    { offset: at(LOCK_OUT), transform: 'scale(0)', opacity: 0, easing: 'cubic-bezier(0.2,0,0.2,1)' },
                    { offset: at(LOCK_POP), transform: 'scale(1.12)', opacity: 1, easing: 'ease-out' },
                    { offset: at(LOCK_READY), transform: 'scale(1)', opacity: 1, easing: 'linear' },
                    { offset: at(LOCK_HOLD), transform: 'scale(1)', opacity: 1, easing: 'cubic-bezier(0.4,0,1,1)' },
                    { offset: at(LOCK_GONE), transform: 'scale(0.2)', opacity: 0, easing: 'linear' },
                    { offset: 1, transform: 'scale(0)', opacity: 0 },
                ],
                LOOP
            )
        );

        animations.push(
            shackle.animate(
                [
                    { offset: 0, transform: SHACKLE_OPEN, easing: 'linear' },
                    { offset: at(LOCK_SWING), transform: SHACKLE_OPEN, easing: 'cubic-bezier(0.35,0.1,0.35,1)' },
                    { offset: at(LOCK_SHUT), transform: SHACKLE_OVERSHOOT, easing: 'cubic-bezier(0.3,0.55,0.35,1)' },
                    { offset: at(LOCK_SEATED), transform: SHACKLE_SHUT, easing: 'linear' },
                    { offset: at(LOCK_GONE), transform: SHACKLE_SHUT, easing: 'linear' },
                    { offset: at(LOCK_GONE + 40), transform: SHACKLE_OPEN, easing: 'linear' },
                    { offset: 1, transform: SHACKLE_OPEN },
                ],
                LOOP
            )
        );

        animations.push(
            body.animate(
                [
                    { offset: 0, transform: 'scale(1, 1)', easing: 'linear' },
                    { offset: at(LOCK_SHUT), transform: 'scale(1, 1)', easing: 'cubic-bezier(0.3,0,0.2,1)' },
                    { offset: at(LOCK_SHUT + SEAT_SQUASH), transform: 'scale(1.045, 0.958)', easing: 'ease-out' },
                    { offset: at(LOCK_SHUT + SEAT_COUNTER), transform: 'scale(0.985, 1.015)', easing: 'ease-out' },
                    { offset: at(LOCK_SHUT + SEAT_DONE), transform: 'scale(1, 1)', easing: 'linear' },
                    { offset: 1, transform: 'scale(1, 1)' },
                ],
                LOOP
            )
        );

        animations.push(
            disc.animate(
                [
                    { offset: 0, transform: 'scale(1)', easing: 'linear' },
                    { offset: at(LOCK_SHUT), transform: 'scale(1)', easing: 'cubic-bezier(0.22,1,0.36,1)' },
                    { offset: at(LOCK_SHUT + DISC_POP), transform: 'scale(1.045)', easing: 'ease-out' },
                    { offset: at(LOCK_SHUT + DISC_DONE), transform: 'scale(1)', easing: 'linear' },
                    { offset: 1, transform: 'scale(1)' },
                ],
                LOOP
            )
        );

        animations.push(
            pulse.animate(
                [
                    { offset: 0, transform: 'scale(0.92)', opacity: 0, easing: 'linear' },
                    { offset: at(LOCK_SHUT - 1), transform: 'scale(0.92)', opacity: 0, easing: 'linear' },
                    {
                        offset: at(LOCK_SHUT),
                        transform: 'scale(0.95)',
                        opacity: 0.4,
                        easing: 'cubic-bezier(0.3,0.5,0.4,1)',
                    },
                    { offset: at(LOCK_SHUT + RING_DONE), transform: 'scale(1.5)', opacity: 0, easing: 'linear' },
                    { offset: 1, transform: 'scale(0.92)', opacity: 0 },
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
                        {ARROWS.map((arrow, index) => {
                            const box = ARROW_BOX * arrow.scale;

                            return (
                                <div
                                    key={`${arrow.y}-${arrow.arrive}`}
                                    ref={(node) => {
                                        arrowRefs.current[index] = node;
                                    }}
                                    className="absolute"
                                    style={{
                                        left: bandX(arrow.rest),
                                        top: bandY(arrow.y - BAND_Y - box / 2),
                                        width: bandX(box),
                                        height: bandY(box),
                                        opacity: arrow.opacity,
                                    }}
                                >
                                    <svg
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        className="absolute inset-0 w-full h-full block"
                                    >
                                        <use href={`#fi-${arrow.icon}-${uid}`} />
                                    </svg>
                                </div>
                            );
                        })}
                    </div>

                    <div
                        ref={googleRef}
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
                        ref={introRef}
                        className="absolute"
                        style={{
                            left: pctX(236),
                            top: pctY(55),
                            width: pctX(80),
                            height: pctY(80),
                            transformOrigin: '50% 100%',
                        }}
                    >
                        <div ref={shakeRef} className="absolute inset-0 w-full h-full block">
                            <div
                                ref={growRef}
                                className="absolute inset-0 w-full h-full block"
                                style={{
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

                                <div
                                    ref={lockRef}
                                    className="absolute opacity-0"
                                    style={{ left: '61.25%', top: '66.25%', width: '45%', height: '45%' }}
                                >
                                    <div
                                        className="absolute"
                                        style={{ left: cutInset, top: cutInset, width: cutSize, height: cutSize }}
                                    >
                                        <svg
                                            viewBox="0 0 40 40"
                                            fill="none"
                                            className="absolute inset-0 w-full h-full block"
                                        >
                                            <circle cx="20" cy="20" r="20" fill={palette.surface} />
                                        </svg>
                                    </div>

                                    <div ref={pulseRef} className="absolute inset-0 w-full h-full block opacity-0">
                                        <svg
                                            viewBox="0 0 36 36"
                                            fill="none"
                                            className="absolute inset-0 w-full h-full block"
                                        >
                                            <circle cx="18" cy="18" r="17" stroke={palette.lock} strokeWidth="2" />
                                        </svg>
                                    </div>

                                    <div ref={discRef} className="absolute inset-0 w-full h-full block">
                                        <svg
                                            viewBox="0 0 36 36"
                                            fill="none"
                                            className="absolute inset-0 w-full h-full block"
                                        >
                                            <path
                                                d="M36 18C36 27.9411 27.9411 36 18 36C8.05887 36 0 27.9411 0 18C0 8.05887 8.05887 0 18 0C27.9411 0 36 8.05887 36 18Z"
                                                fill={palette.lockLight}
                                            />
                                        </svg>
                                    </div>

                                    <div
                                        ref={bodyRef}
                                        className="absolute"
                                        style={{
                                            left: '27.778%',
                                            top: '27.778%',
                                            width: '44.444%',
                                            height: '44.444%',
                                            transformOrigin: '50% 100%',
                                        }}
                                    >
                                        <div
                                            className="absolute"
                                            style={{ left: '12.5%', top: '31.25%', width: '75%', height: '62.5%' }}
                                        >
                                            <svg
                                                viewBox="0 0 12 10"
                                                fill="none"
                                                className="absolute inset-0 w-full h-full block"
                                            >
                                                <path
                                                    d="M1.09202 0.217987C1.49359 0.0133781 2.01165 0.000770569 3 0H4H8.8C9.9201 0 10.4802 0 10.908 0.217987C11.2843 0.409734 11.5903 0.715695 11.782 1.09202C12 1.51984 12 2.0799 12 3.2V6.8C12 7.9201 12 8.48016 11.782 8.90798C11.5903 9.28431 11.2843 9.59027 10.908 9.78201C10.4802 10 9.9201 10 8.8 10H3.2C2.0799 10 1.51984 10 1.09202 9.78201C0.715695 9.59027 0.409734 9.28431 0.217987 8.90798C0 8.48016 0 7.9201 0 6.8V3.2C0 2.0799 0 1.51984 0.217987 1.09202C0.409734 0.715695 0.715695 0.409734 1.09202 0.217987Z"
                                                    fill={palette.lock}
                                                />
                                            </svg>
                                        </div>

                                        <div
                                            className="absolute"
                                            style={{ left: '43.75%', top: '50%', width: '12.5%', height: '25%' }}
                                        >
                                            <svg
                                                viewBox="0 0 2 4"
                                                fill="none"
                                                className="absolute inset-0 w-full h-full block"
                                            >
                                                <path
                                                    fillRule="evenodd"
                                                    clipRule="evenodd"
                                                    d="M1.47064 1.88255C1.78566 1.71421 2 1.38214 2 1C2 0.447715 1.55228 0 1 0C0.447716 0 0 0.447715 0 1C0 1.38214 0.214344 1.71421 0.529363 1.88255L0.0931902 3.62724C0.0458546 3.81658 0.189062 4 0.384233 4H1.61577C1.81094 4 1.95415 3.81658 1.90681 3.62724L1.47064 1.88255Z"
                                                    fill={palette.lockLight}
                                                />
                                            </svg>
                                        </div>

                                        <div
                                            ref={shackleRef}
                                            className="absolute flex items-center justify-center"
                                            style={{
                                                left: '17.95%',
                                                top: '-3.28%',
                                                width: '58.93%',
                                                height: '52.07%',
                                                transform: SHACKLE_OPEN,
                                            }}
                                        >
                                            <div
                                                style={{
                                                    width: '84.84%',
                                                    height: '60.02%',
                                                    transform: 'rotate(-30deg) scaleX(-1)',
                                                }}
                                            >
                                                <svg
                                                    viewBox="0 0 8 5"
                                                    fill="none"
                                                    className="absolute inset-0 w-full h-full block"
                                                >
                                                    <path
                                                        d="M4 0C1.79086 0 0 1.79086 0 4V4.5C0 4.77614 0.223858 5 0.5 5C0.776142 5 1 4.77614 1 4.5V4C1 2.34315 2.34315 1 4 1C5.65685 1 7 2.34315 7 4C7 4 7 4.5 7.5 4.5C8 4.5 8 4 8 4C8 1.79086 6.20914 0 4 0Z"
                                                        fill={palette.lock}
                                                    />
                                                </svg>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div
                        ref={buttonRef}
                        className="absolute rounded-50 opacity-0"
                        style={{
                            left: pctX(BUTTON_X),
                            top: pctY(BUTTON_Y),
                            width: pctX(BUTTON_SIZE),
                            height: pctY(BUTTON_SIZE),
                            background: palette.button,
                            boxShadow: palette.tileShadow,
                        }}
                    >
                        <svg
                            viewBox="0 0 24 24"
                            fill="none"
                            className="absolute block"
                            style={{ left: '25%', top: '25%', width: '50%', height: '50%' }}
                        >
                            <path
                                fillRule="evenodd"
                                clipRule="evenodd"
                                d="M11.5252 3.97118C11.2333 4.26509 11.235 4.73996 11.5289 5.03184L18.5451 11.9997L3.75002 11.9997C3.33581 11.9997 3.00002 12.3355 3.00002 12.7497C3.00002 13.1639 3.33581 13.4997 3.75002 13.4997L18.5451 13.4997L11.5289 20.4675C11.235 20.7594 11.2333 21.2343 11.5252 21.5282C11.8171 21.8221 12.2919 21.8237 12.5858 21.5318L20.6803 13.4932C20.846 13.3287 20.9452 13.1228 20.9779 12.9087C20.989 12.8574 20.9948 12.8042 20.9948 12.7497C20.9948 12.6951 20.989 12.6419 20.9779 12.5907C20.9452 12.3766 20.846 12.1707 20.6803 12.0061L12.5858 3.96751C12.2919 3.67563 11.8171 3.67728 11.5252 3.97118Z"
                                fill={palette.arrow}
                            />
                        </svg>
                    </div>

                    <div
                        ref={clickRef}
                        className="absolute opacity-0"
                        style={{
                            left: pctX(BUTTON_X),
                            top: pctY(BUTTON_Y),
                            width: pctX(BUTTON_SIZE),
                            height: pctY(BUTTON_SIZE),
                        }}
                    >
                        <svg viewBox="0 0 32 32" fill="none" className="absolute inset-0 w-full h-full block">
                            <circle cx="16" cy="16" r="14" stroke={palette.arrow} strokeWidth="2" />
                        </svg>
                    </div>

                    <div
                        ref={cursorRef}
                        className="absolute opacity-0"
                        style={{
                            left: pctX(CURSOR_X),
                            top: pctY(CURSOR_Y),
                            width: pctX(CURSOR_SIZE),
                            height: pctY(CURSOR_SIZE),
                            transformOrigin: '10% 10%',
                        }}
                    >
                        <svg viewBox="0 0 24 24" fill="none" className="absolute inset-0 w-full h-full block">
                            <path
                                d="M5.5 3.21V20.8c0 .45.54.67.85.35l4.86-4.86a.5.5 0 0 1 .35-.15h6.87a.5.5 0 0 0 .35-.85L6.35 2.85a.5.5 0 0 0-.85.36Z"
                                fill={palette.cursor}
                                stroke={palette.cursorRim}
                                strokeWidth="1.4"
                                strokeLinejoin="round"
                            />
                        </svg>
                    </div>
                </div>
            </div>
        </div>
    );
};
