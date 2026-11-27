import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { selectAudioPlaybackStatus } from '@proton/meet/store/slices/deviceManagementSlice/selectors';
import type { AudioPlaybackStatus } from '@proton/meet/store/slices/deviceManagementSlice/types';
import { reloadWindow } from '@proton/shared/lib/helpers/location';

import { AudioPlaybackFrozenBanner } from './AudioPlaybackFrozenBanner';

const storeMocks = vi.hoisted(() => ({ useMeetSelector: vi.fn() }));
vi.mock('@proton/meet/store/hooks', () => storeMocks);

vi.mock('@proton/shared/lib/helpers/location', () => ({ reloadWindow: vi.fn() }));

const renderWithStatus = (audioPlaybackStatus: AudioPlaybackStatus) => {
    storeMocks.useMeetSelector.mockImplementation((selector: unknown) =>
        selector === selectAudioPlaybackStatus ? audioPlaybackStatus : undefined
    );

    render(<AudioPlaybackFrozenBanner />);
};

describe('AudioPlaybackFrozenBanner', () => {
    afterEach(() => {
        vi.clearAllMocks();
    });

    it('shows an alert asking to reload when playback is frozen', () => {
        renderWithStatus('frozen');

        expect(screen.getByRole('alert')).toHaveTextContent(
            'Audio stopped working. You can’t hear others and they can’t hear you.'
        );
        expect(screen.getByRole('button', { name: 'Reload' })).toBeInTheDocument();
    });

    it.each<AudioPlaybackStatus>(['running', 'recovering', 'blocked'])(
        'shows nothing for any other playback status (%s)',
        (audioPlaybackStatus) => {
            renderWithStatus(audioPlaybackStatus);

            expect(screen.queryByRole('alert')).toBeNull();
        }
    );

    it('reloads the page from the Reload button', async () => {
        renderWithStatus('frozen');

        await userEvent.click(screen.getByRole('button', { name: 'Reload' }));

        expect(reloadWindow).toHaveBeenCalledTimes(1);
    });

    it('reaches the Reload button with Tab and reloads with Enter', async () => {
        renderWithStatus('frozen');

        await userEvent.tab();

        expect(screen.getByRole('button', { name: 'Reload' })).toHaveFocus();

        await userEvent.keyboard('{Enter}');

        expect(reloadWindow).toHaveBeenCalledTimes(1);
    });
});
