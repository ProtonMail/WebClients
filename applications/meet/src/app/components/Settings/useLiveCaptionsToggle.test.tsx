import { act, renderHook } from '@testing-library/react';

import { useCaptionsAvailability } from '../../hooks/captions/useCaptionsAvailability';
import { useCaptionsConsentSkipped } from '../../hooks/captions/useCaptionsConsentSkipped';
import { useCaptionsPreference } from '../../hooks/captions/useCaptionsPreference';
import { useLiveCaptionsToggle } from './useLiveCaptionsToggle';

const announce = vi.fn();
const setWantsCaptions = vi.fn();

vi.mock('@proton/components/components/liveAnnouncer/useAnnounce', () => ({ useAnnounce: () => announce }));
vi.mock('@proton/app-context/useNotifications', () => ({ useNotifications: () => ({ createNotification: vi.fn() }) }));
vi.mock('@proton/meet/telemetry/meetTelemetry', () => ({
    TelemetryMeetActionsEvents: { captions_toggled: 'captions_toggled' },
    sendMeetActionsEvent: vi.fn(),
}));
vi.mock('../../hooks/captions/useCaptionsAvailability', () => ({ useCaptionsAvailability: vi.fn() }));
vi.mock('../../hooks/captions/useCaptionsConsentSkipped', () => ({ useCaptionsConsentSkipped: vi.fn() }));
vi.mock('../../hooks/captions/useCaptionsPreference', () => ({ useCaptionsPreference: vi.fn() }));

const setup = (wantsCaptions: boolean) => {
    setWantsCaptions.mockResolvedValue(undefined);
    vi.mocked(useCaptionsPreference).mockReturnValue({ wantsCaptions, setWantsCaptions });
    vi.mocked(useCaptionsAvailability).mockReturnValue({ isCaptionsDisabled: false });
    vi.mocked(useCaptionsConsentSkipped).mockReturnValue({ isConsentSkipped: () => true, skipConsent: vi.fn() });

    return renderHook(() => useLiveCaptionsToggle());
};

describe('useLiveCaptionsToggle announcements', () => {
    beforeEach(() => {
        announce.mockClear();
        setWantsCaptions.mockClear();
    });

    it('announces when the user turns captions on', async () => {
        const { result } = setup(false);

        await act(async () => result.current.onChange());

        expect(announce).toHaveBeenCalledWith('Live captions turned on', expect.anything());
    });

    it('announces every change, even the same state again right after', async () => {
        vi.useFakeTimers();
        const { result } = setup(false);

        await act(async () => result.current.onChange());
        vi.advanceTimersByTime(1000);
        await act(async () => result.current.onChange());
        vi.useRealTimers();

        expect(announce).toHaveBeenCalledTimes(2);
        const [first, second] = announce.mock.calls.map(([, options]) => options.dedupeKey);
        expect(first).not.toBe(second);
    });

    it('announces changes from two toggles, such as the More menu and Settings', async () => {
        vi.useFakeTimers();
        const moreMenu = setup(false);
        const settings = renderHook(() => useLiveCaptionsToggle());

        await act(async () => moreMenu.result.current.onChange());
        vi.advanceTimersByTime(1000);
        await act(async () => settings.result.current.onChange());
        vi.useRealTimers();

        expect(announce).toHaveBeenCalledTimes(2);
        const [first, second] = announce.mock.calls.map(([, options]) => options.dedupeKey);
        expect(first).not.toBe(second);
    });

    it('announces when the user turns captions off', async () => {
        const { result } = setup(true);

        await act(async () => result.current.onChange());

        expect(announce).toHaveBeenCalledWith('Live captions turned off', expect.anything());
    });

    it('does not announce when saving the preference fails', async () => {
        const { result } = setup(true);
        setWantsCaptions.mockRejectedValue(new Error('failed'));

        await act(async () => result.current.onChange());

        expect(announce).not.toHaveBeenCalled();
    });
});
