import { memo, useLayoutEffect, useRef } from 'react';

import { useReducedMotion } from '@proton/components/hooks/useReducedMotion';
import clsx from '@proton/utils/clsx';

import { CatPose } from './catPose';
import catSpriteAtlas from './catSpriteAtlas.png';
import type { PoseAnimation } from './catSpriteManifest';
import { CAT_SPRITE_MANIFEST, getBackgroundPosition, getPoseAnimation } from './catSpriteManifest';

/** One grid pixel, in step with $cat-pixel in LumoPet.scss, so the art scales with the font size */
export const CAT_PIXEL_REM = 0.1875;

const POSE_ANIMATIONS = Object.fromEntries(
    Object.values(CatPose).map((pose) => [pose, getPoseAnimation(pose, CAT_PIXEL_REM)])
) as Record<CatPose, PoseAnimation | null>;

const toRem = (gridPixels: number) => {
    return `${gridPixels * CAT_PIXEL_REM}rem`;
};

interface Props {
    pose: CatPose;
    isMirrored: boolean;
}

const CatSprite = ({ pose, isMirrored }: Props) => {
    const isReducedMotion = useReducedMotion();
    const spriteRef = useRef<HTMLSpanElement>(null);
    const spritePose = CAT_SPRITE_MANIFEST.poses[pose];

    // Swaps the animation before paint, so a new pose never shows a frame of the old pose's row
    useLayoutEffect(() => {
        const animation = isReducedMotion ? null : POSE_ANIMATIONS[pose];
        const sprite = spriteRef.current;
        if (!animation || typeof sprite?.animate !== 'function') {
            return;
        }
        const playback = sprite.animate(animation.keyframes, animation.options);
        return () => playback.cancel();
    }, [pose, isReducedMotion]);

    return (
        <span
            className={clsx('lumo-pet-cat relative block', isMirrored && 'lumo-pet-cat--mirrored')}
            aria-hidden="true"
        >
            <span
                ref={spriteRef}
                className="lumo-pet-cat-sprite absolute bottom-0 pointer-events-none"
                style={{
                    left: toRem((CAT_SPRITE_MANIFEST.gridWidth - spritePose.width) / 2),
                    width: toRem(spritePose.width),
                    height: toRem(spritePose.height),
                    backgroundImage: `url(${catSpriteAtlas})`,
                    backgroundSize: `${toRem(CAT_SPRITE_MANIFEST.atlasWidth)} ${toRem(CAT_SPRITE_MANIFEST.atlasHeight)}`,
                    backgroundPosition: getBackgroundPosition(spritePose, spritePose.steps[0].cell, CAT_PIXEL_REM),
                }}
            />
            <span className="lumo-pet-cat-hit absolute bottom-0 start-0" />
        </span>
    );
};

export default memo(CatSprite);
