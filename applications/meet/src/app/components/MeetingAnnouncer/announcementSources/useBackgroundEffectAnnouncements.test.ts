import { renderHook } from '@testing-library/react';

import type { BackgroundEffect } from '../../../utils/virtualBackgrounds/virtualBackgrounds';
import { useBackgroundEffectAnnouncements } from './useBackgroundEffectAnnouncements';

const announce = vi.fn();
const mediaManagementMocks = vi.hoisted(() => ({ useMediaManagementContext: vi.fn() }));

vi.mock('../useAnnounce', () => ({ useAnnounce: () => announce }));
vi.mock('../../../contexts/MediaManagementProvider/MediaManagementContext', () => mediaManagementMocks);

const renderWithEffect = (initialEffect: BackgroundEffect) =>
    renderHook(
        ({ effect }: { effect: BackgroundEffect }) => {
            mediaManagementMocks.useMediaManagementContext.mockReturnValue({ appliedBackgroundEffect: effect });
            return useBackgroundEffectAnnouncements();
        },
        { initialProps: { effect: initialEffect } }
    );

describe('useBackgroundEffectAnnouncements', () => {
    beforeEach(() => {
        announce.mockClear();
    });

    it('should not announce the effect carried over from the prejoin screen', () => {
        renderWithEffect('office');

        expect(announce).not.toHaveBeenCalled();
    });

    it('should announce the virtual background by name', () => {
        const { rerender } = renderWithEffect('none');

        rerender({ effect: 'office' });

        expect(announce).toHaveBeenCalledWith('Office background applied');
    });

    it('should announce blur with a spelled out label', () => {
        const { rerender } = renderWithEffect('none');

        rerender({ effect: 'blur' });

        expect(announce).toHaveBeenCalledWith('Blurred background applied');
    });

    it('should announce going back to no effect', () => {
        const { rerender } = renderWithEffect('office');

        rerender({ effect: 'none' });

        expect(announce).toHaveBeenCalledWith('Background effect turned off');
    });

    it('should not announce a re-render that keeps the same effect', () => {
        const { rerender } = renderWithEffect('none');

        rerender({ effect: 'office' });
        rerender({ effect: 'office' });

        expect(announce).toHaveBeenCalledTimes(1);
    });
});
