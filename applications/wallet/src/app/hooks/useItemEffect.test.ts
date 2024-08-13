import { renderHook } from '@testing-library/react-hooks';

import { useItemEffect } from './useItemEffect';

describe('useItemEffect', () => {
    describe('when no item change between rerenders', () => {
        it('should call effect only once per item', () => {
            const effect = vi.fn();
            let items = [{ x: 1 }, { y: 1 }, { z: 1 }];

            const { rerender } = renderHook(() => useItemEffect(effect, items));

            items = [{ x: 1 }, { y: 1 }, { z: 1 }];
            rerender();

            expect(effect).toHaveBeenCalledTimes(3);
            expect(effect).toHaveBeenNthCalledWith(1, { x: 1 });
            expect(effect).toHaveBeenNthCalledWith(2, { y: 1 });
            expect(effect).toHaveBeenNthCalledWith(3, { z: 1 });
        });
    });

    describe('when one item change between rerenders', () => {
        it('should call effect twice for the changed item', () => {
            const effect = vi.fn();
            let items = [{ x: 1 }, { y: 1 }, { z: 1 }];

            const { rerender } = renderHook(() => useItemEffect(effect, items));

            items = [{ x: 2 }];
            rerender();

            expect(effect).toHaveBeenCalledTimes(4);

            expect(effect).toHaveBeenNthCalledWith(1, { x: 1 });
            expect(effect).toHaveBeenNthCalledWith(2, { y: 1 });
            expect(effect).toHaveBeenNthCalledWith(3, { z: 1 });
            expect(effect).toHaveBeenNthCalledWith(4, { x: 2 });
        });
    });

    describe('when two item change between rerenders', () => {
        it('should call effect twice for both changed items', () => {
            const effect = vi.fn();
            let items = [{ x: 1 }, { y: 1 }, { z: 1 }];

            const { rerender } = renderHook(() => useItemEffect(effect, items));

            items = [{ x: 2 }, { y: 1 }, { z: 2 }];
            rerender();

            expect(effect).toHaveBeenCalledTimes(5);

            expect(effect).toHaveBeenNthCalledWith(1, { x: 1 });
            expect(effect).toHaveBeenNthCalledWith(2, { y: 1 });
            expect(effect).toHaveBeenNthCalledWith(3, { z: 1 });
            expect(effect).toHaveBeenNthCalledWith(4, { x: 2 });
            expect(effect).toHaveBeenNthCalledWith(5, { z: 2 });
        });
    });

    describe('when new item is added', () => {
        it('should call effect only for added item', () => {
            const effect = vi.fn();
            let items: object[] = [{ x: 1 }, { y: 1 }];

            const { rerender } = renderHook(() => useItemEffect(effect, items));
            effect.mockClear();

            items = [{ x: 1 }, { y: 1 }, { z: 1 }];
            rerender();

            expect(effect).toHaveBeenCalledTimes(1);
            expect(effect).toHaveBeenCalledWith({ z: 1 });
        });
    });

    describe('when item is removed', () => {
        it('should not effect any effect', () => {
            const effect = vi.fn();
            let items: object[] = [{ x: 1 }, { y: 1 }, { z: 1 }];

            const { rerender } = renderHook(() => useItemEffect(effect, items));
            effect.mockClear();

            items = [{ x: 1 }, { y: 1 }];
            rerender();

            expect(effect).toHaveBeenCalledTimes(0);
        });
    });

    it('should cleanup effect if cleanup is provided', () => {
        const cleanupA = vi.fn();
        const cleanupB = vi.fn();

        const effect = vi
            .fn()
            .mockReturnValueOnce(cleanupA)
            .mockReturnValueOnce(undefined)
            .mockReturnValueOnce(cleanupB);

        let items = [{ x: 1 }, { y: 1 }, { z: 1 }];

        const { rerender } = renderHook(() => useItemEffect(effect, items));

        items = [{ x: 2 }, { y: 1 }, { z: 1 }];
        rerender();

        expect(cleanupA).toHaveBeenCalledTimes(1);
        expect(cleanupB).toHaveBeenCalledTimes(1);
    });
});
