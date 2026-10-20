import { act, renderHook } from '@testing-library/react';

import { PanelSide } from '../floating/panelSide';
import { CatJump, CatRun, CatTrick } from './catPose';
import { useCatMotion } from './useCatMotion';

const initialProps = { side: PanelSide.RIGHT, isCatHidden: false, canJump: true, runMs: 1000 };

const renderMotion = (props: Partial<typeof initialProps> = {}) => {
    return renderHook((options: typeof initialProps) => useCatMotion(options), {
        initialProps: { ...initialProps, ...props },
    });
};

describe('useCatMotion', () => {
    beforeEach(() => jest.useFakeTimers());
    afterEach(() => jest.useRealTimers());

    it('jumps out when hidden and back in when revealed, holding each jump until it ends', () => {
        const { result, rerender } = renderMotion();

        rerender({ ...initialProps, isCatHidden: true });
        expect(result.current.motion).toMatchObject({ isHidden: true, jump: CatJump.OUT });

        act(() => result.current.endJump());
        expect(result.current.motion).toMatchObject({ isHidden: true, jump: null });

        rerender({ ...initialProps, isCatHidden: false });
        expect(result.current.motion).toMatchObject({ isHidden: false, jump: CatJump.IN });
    });

    it('hides without a jump when it cannot jump', () => {
        const { result, rerender } = renderMotion({ canJump: false });

        rerender({ ...initialProps, canJump: false, isCatHidden: true });

        expect(result.current.motion).toMatchObject({ isHidden: true, jump: null });
    });

    it('moves straight to the new side while hidden', () => {
        const { result, rerender } = renderMotion({ isCatHidden: true });

        rerender({ ...initialProps, isCatHidden: true, side: PanelSide.LEFT });

        expect(result.current.shownSide).toBe(PanelSide.LEFT);
        expect(result.current.motion.run).toBeNull();
    });

    it('plays no trick while running', () => {
        const { result, rerender } = renderMotion();
        rerender({ ...initialProps, side: PanelSide.LEFT });
        expect(result.current.motion.run).toBe(CatRun.GALLOP);

        act(() => result.current.playTrick(CatTrick.ENCRYPT));

        expect(result.current.motion.trick).toBeNull();
    });

    it('plays no trick while jumping back in', () => {
        const { result, rerender } = renderMotion({ isCatHidden: true });
        rerender({ ...initialProps, isCatHidden: false });
        expect(result.current.motion.jump).toBe(CatJump.IN);

        act(() => result.current.playTrick(CatTrick.ENCRYPT));

        expect(result.current.motion.trick).toBeNull();
    });
});
