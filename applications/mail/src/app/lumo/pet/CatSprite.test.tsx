import { useState } from 'react';

import { act, render } from '@testing-library/react';

import { useReducedMotion } from '@proton/components/hooks/useReducedMotion';

import CatSprite, { CAT_PIXEL_REM } from './CatSprite';
import { CatPose } from './catPose';
import { CAT_SPRITE_MANIFEST, getPoseAnimation } from './catSpriteManifest';

jest.mock('@proton/components/hooks/useReducedMotion', () => ({ useReducedMotion: jest.fn() }));

const mockUseReducedMotion = jest.mocked(useReducedMotion);

describe('CatSprite', () => {
    let animate: jest.Mock;
    let cancels: jest.Mock[];

    beforeEach(() => {
        mockUseReducedMotion.mockReturnValue(false);
        cancels = [];
        animate = jest.fn(() => {
            const cancel = jest.fn();
            cancels.push(cancel);
            return { cancel };
        });
        HTMLElement.prototype.animate = animate;
    });

    const expectAnimatedAs = (call: number, pose: CatPose) => {
        const { keyframes, options } = getPoseAnimation(pose, CAT_PIXEL_REM)!;
        expect(animate.mock.calls[call]).toEqual([keyframes, options]);
    };

    it('plays the new pose and stops the old one when the pose changes', () => {
        const { rerender } = render(<CatSprite pose={CatPose.SIT} isMirrored={false} />);

        rerender(<CatSprite pose={CatPose.SEARCH} isMirrored={false} />);

        expect(animate).toHaveBeenCalledTimes(2);
        expectAnimatedAs(1, CatPose.SEARCH);
        expect(cancels[0]).toHaveBeenCalled();
        expect(cancels[1]).not.toHaveBeenCalled();
    });

    it('restarts a pose from its first step when re-entering it', () => {
        const { rerender } = render(<CatSprite pose={CatPose.SIT} isMirrored={false} />);
        rerender(<CatSprite pose={CatPose.SEARCH} isMirrored={false} />);

        rerender(<CatSprite pose={CatPose.SIT} isMirrored={false} />);

        expect(animate).toHaveBeenCalledTimes(3);
        expectAnimatedAs(2, CatPose.SIT);
    });

    it('stops the old pose and starts nothing when changing to a single-step pose', () => {
        const { rerender } = render(<CatSprite pose={CatPose.SIT} isMirrored={false} />);

        rerender(<CatSprite pose={CatPose.HAPPY} isMirrored={false} />);

        expect(animate).toHaveBeenCalledTimes(1);
        expect(cancels[0]).toHaveBeenCalled();
    });

    it('stops a playing pose when reduced motion turns on', () => {
        let setIsReducedMotion: (isReducedMotion: boolean) => void = () => {};
        mockUseReducedMotion.mockImplementation(() => {
            const [isReducedMotion, setState] = useState(false);
            setIsReducedMotion = setState;
            return isReducedMotion;
        });
        render(<CatSprite pose={CatPose.SIT} isMirrored={false} />);

        act(() => setIsReducedMotion(true));

        expect(animate).toHaveBeenCalledTimes(1);
        expect(cancels[0]).toHaveBeenCalled();
    });

    it('centres a pose wider than the cat box and scales the atlas to the pixel size', () => {
        const { container } = render(<CatSprite pose={CatPose.RUN} isMirrored={false} />);

        const runWidth = CAT_SPRITE_MANIFEST.poses[CatPose.RUN].width;
        const atlasWidth = CAT_SPRITE_MANIFEST.atlasWidth * CAT_PIXEL_REM;
        const atlasHeight = CAT_SPRITE_MANIFEST.atlasHeight * CAT_PIXEL_REM;
        const sprite = container.querySelector<HTMLElement>('.lumo-pet-cat-sprite');
        expect(sprite?.style.left).toBe(`${((CAT_SPRITE_MANIFEST.gridWidth - runWidth) / 2) * CAT_PIXEL_REM}rem`);
        expect(sprite?.style.width).toBe(`${runWidth * CAT_PIXEL_REM}rem`);
        expect(sprite?.style.backgroundSize).toBe(`${atlasWidth}rem ${atlasHeight}rem`);
    });

    it('holds the first frame still under reduced motion', () => {
        mockUseReducedMotion.mockReturnValue(true);

        const { container } = render(<CatSprite pose={CatPose.SEARCH} isMirrored={false} />);

        expect(animate).not.toHaveBeenCalled();
        const rowTop = CAT_SPRITE_MANIFEST.poses[CatPose.SEARCH].y * CAT_PIXEL_REM;
        const sprite = container.querySelector<HTMLElement>('.lumo-pet-cat-sprite');
        expect(sprite?.style.backgroundPosition).toBe(`0rem -${rowTop}rem`);
    });

    it('holds the first frame still where the browser cannot animate', () => {
        HTMLElement.prototype.animate = undefined as unknown as HTMLElement['animate'];

        const { container } = render(<CatSprite pose={CatPose.SEARCH} isMirrored={false} />);

        const rowTop = CAT_SPRITE_MANIFEST.poses[CatPose.SEARCH].y * CAT_PIXEL_REM;
        const sprite = container.querySelector<HTMLElement>('.lumo-pet-cat-sprite');
        expect(sprite?.style.backgroundPosition).toBe(`0rem -${rowTop}rem`);
    });

    it('mirrors the cat on request', () => {
        const { container } = render(<CatSprite pose={CatPose.RUN} isMirrored />);

        expect(container.querySelector('.lumo-pet-cat')).toHaveClass('lumo-pet-cat--mirrored');
    });
});
