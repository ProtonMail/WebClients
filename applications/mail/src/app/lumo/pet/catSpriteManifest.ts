import { CatPose, CatTrick } from './catPose';
import catSpriteManifestJson from './catSpriteManifest.json';

interface CatSpriteStep {
    cell: number;
    /** 0 on a play-once pose's last step, which is held */
    ms: number;
}

export interface CatSpritePose {
    y: number;
    width: number;
    height: number;
    playsOnce: boolean;
    steps: CatSpriteStep[];
}

/** Every unit is a grid pixel; the atlas draws one atlas pixel per grid pixel. */
export interface CatSpriteManifest {
    gridWidth: number;
    gridHeight: number;
    atlasWidth: number;
    atlasHeight: number;
    poses: Record<CatPose, CatSpritePose>;
}

export const CAT_SPRITE_MANIFEST: CatSpriteManifest = catSpriteManifestJson;

const SWEEP_LINGER_MS = 1250;

const sumStepMs = (steps: CatSpriteStep[]) => {
    return steps.reduce((total, step) => total + step.ms, 0);
};

const playOnceMs = (pose: CatPose, lingerMs: number) => {
    return sumStepMs(CAT_SPRITE_MANIFEST.poses[pose].steps.slice(0, -1)) + lingerMs;
};

export const SWEEP_MS = playOnceMs(CatPose.SWEEP, SWEEP_LINGER_MS);

export const CAT_TRICK_MS: Record<CatTrick, number> = {
    [CatTrick.SCHRODINGER_IN_BOX]: playOnceMs(CatPose.SCHRODINGER_IN_BOX, 800),
    [CatTrick.SCHRODINGER_OUT_OF_BOX]: playOnceMs(CatPose.SCHRODINGER_OUT_OF_BOX, 600),
    [CatTrick.NINE_LIVES]: playOnceMs(CatPose.NINE_LIVES, 400),
    [CatTrick.ENCRYPT]: playOnceMs(CatPose.ENCRYPT, 1000),
};

export const getBackgroundPosition = ({ y, width }: CatSpritePose, cell: number, pixelRem: number) => {
    return `-${cell * width * pixelRem}rem -${y * pixelRem}rem`;
};

export interface PoseAnimation {
    keyframes: Keyframe[];
    options: KeyframeAnimationOptions;
}

export const getPoseAnimation = (pose: CatPose, pixelRem: number): PoseAnimation | null => {
    const spritePose = CAT_SPRITE_MANIFEST.poses[pose];
    const { steps, playsOnce } = spritePose;
    if (steps.length === 1) {
        return null;
    }

    const durationMs = sumStepMs(steps);
    const toKeyframe = (cell: number, startMs: number): Keyframe => {
        return {
            backgroundPosition: getBackgroundPosition(spritePose, cell, pixelRem),
            offset: startMs / durationMs,
            easing: 'steps(1, end)',
        };
    };
    let elapsedMs = 0;
    const keyframes = steps.map((step) => {
        const keyframe = toKeyframe(step.cell, elapsedMs);
        elapsedMs += step.ms;
        return keyframe;
    });

    if (playsOnce) {
        return { keyframes, options: { duration: durationMs, iterations: 1, fill: 'forwards' } };
    }

    const lastCell = steps[steps.length - 1].cell;
    return {
        keyframes: [...keyframes, toKeyframe(lastCell, durationMs)],
        options: { duration: durationMs, iterations: Infinity },
    };
};
