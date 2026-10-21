import { CatPose, CatTrick } from './catPose';
import { CAT_SPRITE_MANIFEST, CAT_TRICK_MS, SWEEP_MS, getPoseAnimation } from './catSpriteManifest';

const PIXEL_REM = 0.1875;
const STEP_EASING = 'steps(1, end)';
const poseEntries = Object.entries(CAT_SPRITE_MANIFEST.poses).map(([pose, spritePose]) => ({ pose, ...spritePose }));

describe('CAT_SPRITE_MANIFEST', () => {
    it('ships exactly the poses Mail can show', () => {
        expect(Object.keys(CAT_SPRITE_MANIFEST.poses).sort()).toEqual(Object.values(CatPose).sort());
    });

    it.each(poseEntries)('$pose keeps every step inside the atlas', ({ y, width, height, steps }) => {
        expect(y + height).toBeLessThanOrEqual(CAT_SPRITE_MANIFEST.atlasHeight);
        steps.forEach(({ cell }) => expect((cell + 1) * width).toBeLessThanOrEqual(CAT_SPRITE_MANIFEST.atlasWidth));
    });

    it.each(poseEntries)('$pose stands on the floor and centres on whole pixels', ({ width, height }) => {
        expect(height).toBeGreaterThanOrEqual(CAT_SPRITE_MANIFEST.gridHeight);
        expect((width - CAT_SPRITE_MANIFEST.gridWidth) % 2).toBe(0);
    });

    it.each(poseEntries)('$pose holds only its last step when it plays once', ({ playsOnce, steps }) => {
        const heldStepIndexes = steps.flatMap(({ ms }, index) => (ms === 0 ? [index] : []));
        expect(heldStepIndexes).toEqual(playsOnce ? [steps.length - 1] : []);
    });
});

describe('play-once lengths', () => {
    it('lingers on the sweep for its linger past the last step', () => {
        expect(SWEEP_MS).toBe(2500);
    });

    it('times each trick from its steps plus its linger', () => {
        expect(CAT_TRICK_MS).toEqual({
            [CatTrick.SCHRODINGER_IN_BOX]: 5740,
            [CatTrick.SCHRODINGER_OUT_OF_BOX]: 6960,
            [CatTrick.NINE_LIVES]: 4090,
            [CatTrick.ENCRYPT]: 4060,
        });
    });
});

describe('getPoseAnimation', () => {
    it('stays still on a single-step pose', () => {
        expect(getPoseAnimation(CatPose.HAPPY, PIXEL_REM)).toBeNull();
    });

    it('loops a pose, closing on its last step so that step keeps its full time', () => {
        const { y, width } = CAT_SPRITE_MANIFEST.poses[CatPose.SEARCH];
        const rowTop = y * PIXEL_REM;
        const cellWidth = width * PIXEL_REM;

        expect(getPoseAnimation(CatPose.SEARCH, PIXEL_REM)).toEqual({
            keyframes: [
                { backgroundPosition: `-0rem -${rowTop}rem`, offset: 0, easing: STEP_EASING },
                { backgroundPosition: `-${cellWidth}rem -${rowTop}rem`, offset: 600 / 1800, easing: STEP_EASING },
                { backgroundPosition: `-0rem -${rowTop}rem`, offset: 1000 / 1800, easing: STEP_EASING },
                { backgroundPosition: `-${2 * cellWidth}rem -${rowTop}rem`, offset: 1300 / 1800, easing: STEP_EASING },
                { backgroundPosition: `-${2 * cellWidth}rem -${rowTop}rem`, offset: 1, easing: STEP_EASING },
            ],
            options: { duration: 1800, iterations: Infinity },
        });
    });

    it('plays a play-once pose once and holds its last step', () => {
        const { y, width } = CAT_SPRITE_MANIFEST.poses[CatPose.JUMP_OUT];
        const rowTop = y * PIXEL_REM;
        const cellWidth = width * PIXEL_REM;

        expect(getPoseAnimation(CatPose.JUMP_OUT, PIXEL_REM)).toEqual({
            keyframes: [
                { backgroundPosition: `-0rem -${rowTop}rem`, offset: 0, easing: STEP_EASING },
                { backgroundPosition: `-${cellWidth}rem -${rowTop}rem`, offset: 150 / 405, easing: STEP_EASING },
                { backgroundPosition: `-${2 * cellWidth}rem -${rowTop}rem`, offset: 1, easing: STEP_EASING },
            ],
            options: { duration: 405, iterations: 1, fill: 'forwards' },
        });
    });
});
